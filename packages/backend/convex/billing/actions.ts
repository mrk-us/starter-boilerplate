"use node";

import { APP_URL } from "@repo/config";
import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import Stripe from "stripe";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action } from "../_generated/server";
import { ERROR_CODE, ERROR_MESSAGE } from "../errors/constants";
import {
  BILLING_ERROR_CODE,
  ENDED_SUBSCRIPTION_STATUSES,
  PRO_SUBSCRIPTION_STATUSES,
  STRIPE_API_VERSION,
  STRIPE_PRICE_LOOKUP_KEY,
} from "./constants";
import { createSubscriptionHash } from "./helpers";
import { stripe } from "./index";

/**
 * Get Stripe client for direct API calls
 */
function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ConvexError({
      code: ERROR_CODE.UNKNOWN,
      message: ERROR_MESSAGE.UNKNOWN,
    });
  }
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

/**
 * Look up a Stripe price by its lookup key
 */
async function getPriceIdByLookupKey(lookupKey: string): Promise<string> {
  const stripeClient = getStripeClient();
  const prices = await stripeClient.prices.list({
    active: true,
    lookup_keys: [lookupKey],
  });

  const [price] = prices.data;

  if (!price) {
    throw new ConvexError({
      code: BILLING_ERROR_CODE.CHECKOUT_FAILED,
      message: ERROR_MESSAGE.UNKNOWN,
    });
  }

  return price.id;
}

/**
 * Get or create a Stripe customer with caching.
 * Uses cached stripeCustomerId when available, otherwise looks up/creates and caches.
 * Customers are matched by user ID only. An email match is not proof of ownership.
 */
async function getOrCreateStripeCustomerWithCache(
  ctx: ActionCtx,
  userInfo: {
    _id: Id<"users">;
    email: string;
    stripeCustomerId?: string | null;
  }
): Promise<string> {
  // Use cached customer ID if available
  if (userInfo.stripeCustomerId) {
    return userInfo.stripeCustomerId;
  }

  const existingCustomer = await ctx.runQuery(
    components.stripe.public.getCustomerByUserId,
    { userId: userInfo._id }
  );

  const customerId =
    existingCustomer?.stripeCustomerId ??
    (
      await stripe.createCustomer(ctx, {
        email: userInfo.email,
        idempotencyKey: userInfo._id,
        metadata: { userId: userInfo._id },
      })
    ).customerId;

  // Cache the customer ID on the user record for future calls
  await ctx.runMutation(internal.billing.mutations.updateStripeCustomerId, {
    stripeCustomerId: customerId,
    userId: userInfo._id,
  });

  return customerId;
}

/**
 * List the customer's subscriptions directly from Stripe.
 * Component rows depend on webhook delivery, so they can be late or missing.
 */
async function listStripeSubscriptions(customerId: string) {
  const subscriptions = await getStripeClient().subscriptions.list({
    customer: customerId,
    limit: 100,
    status: "all",
  });

  return subscriptions.data;
}

function canStillCharge(subscription: Stripe.Subscription) {
  return !ENDED_SUBSCRIPTION_STATUSES.includes(subscription.status);
}

/**
 * Save subscriptions read from Stripe in the component's table, with the same
 * values as the webhook. The first mutation inserts a missing row and the second
 * updates an existing row.
 */
async function saveSubscriptions(
  ctx: ActionCtx,
  subscriptions: Stripe.Subscription[]
) {
  await Promise.all(
    subscriptions.map(async (subscription) => {
      const [item] = subscription.items.data;
      const values = {
        cancelAt: subscription.cancel_at ?? undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: item?.current_period_end ?? 0,
        metadata: subscription.metadata,
        quantity: item?.quantity ?? 1,
        status: subscription.status,
        stripeSubscriptionId: subscription.id,
      };
      const stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      await ctx.runMutation(
        components.stripe.private.handleSubscriptionCreated,
        { ...values, priceId: item?.price.id ?? "", stripeCustomerId }
      );
      await ctx.runMutation(
        components.stripe.private.handleSubscriptionUpdated,
        { ...values, priceId: item?.price.id, stripeCustomerId }
      );
    })
  );
}

/**
 * Expire the customer's open Checkout sessions, so that an older tab cannot
 * complete a second subscription.
 */
async function expireOpenCheckoutSessions(customerId: string) {
  const stripeClient = getStripeClient();
  const sessions = await stripeClient.checkout.sessions.list({
    customer: customerId,
    limit: 100,
    status: "open",
  });

  await Promise.all(
    sessions.data.map((session) =>
      stripeClient.checkout.sessions.expire(session.id)
    )
  );
}

/**
 * Cancel every subscription of the user that can still charge them.
 * Throws when a cancellation fails, so that account deletion stops and the user
 * is not charged without an account.
 */
export async function cancelUserSubscriptions(
  stripeCustomerId: string | undefined
): Promise<void> {
  if (!stripeCustomerId) {
    return;
  }

  const { error } = await tryCatch(
    (async () => {
      const subscriptions = await listStripeSubscriptions(stripeCustomerId);
      await Promise.all(
        subscriptions
          .filter(canStillCharge)
          .map((subscription) =>
            getStripeClient().subscriptions.cancel(subscription.id)
          )
      );
    })()
  );

  if (error) {
    console.error(
      "[cancelUserSubscriptions] Failed to cancel subscriptions:",
      error.message
    );
    throw new ConvexError({
      code: BILLING_ERROR_CODE.SUBSCRIPTION_CANCEL_FAILED,
      message:
        "We could not cancel your subscription, so your account was not deleted. Try again.",
    });
  }
}

/**
 * Generate checkout link for a subscription
 */
export const generateCheckoutLink = action({
  args: {
    cancelUrl: v.optional(v.string()),
    priceLookupKey: v.union(
      v.literal(STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY),
      v.literal(STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY)
    ),
    successUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user (throws if not authenticated)
    const userInfo = await ctx.runQuery(
      internal.billing.queries.requireCurrentUserForBilling
    );

    // Parallelize: Get price ID + customer ID
    const [priceId, customerId] = await Promise.all([
      getPriceIdByLookupKey(args.priceLookupKey),
      getOrCreateStripeCustomerWithCache(ctx, userInfo),
    ]);

    // Stripe is the source of truth here, because a webhook can be late or lost.
    // Saving the rows also corrects a billing page that still shows Free.
    const subscriptions = await listStripeSubscriptions(customerId);
    // An incomplete subscription has no first payment and expires by itself
    const hasSubscription = subscriptions.some(
      (subscription) =>
        canStillCharge(subscription) && subscription.status !== "incomplete"
    );
    if (hasSubscription) {
      await saveSubscriptions(ctx, subscriptions);
      throw new ConvexError({
        code: BILLING_ERROR_CODE.ALREADY_SUBSCRIBED,
        message: "You already have a subscription. Manage it from this page.",
      });
    }

    await expireOpenCheckoutSessions(customerId);

    const currentSubscription = await ctx.runQuery(
      internal.billing.queries.getSubscriptionStatusByUserId,
      { userId: userInfo._id }
    );

    // Create hash for checkout success comparison
    const preCheckoutHash = await createSubscriptionHash(currentSubscription);

    // Append hash to success URL for post-checkout comparison
    const successUrlWithHash = new URL(args.successUrl);
    successUrlWithHash.searchParams.set("preCheckoutHash", preCheckoutHash);

    // Create checkout session
    const session = await stripe.createCheckoutSession(ctx, {
      cancelUrl: args.cancelUrl ?? args.successUrl,
      customerId,
      mode: "subscription",
      priceId,
      subscriptionMetadata: {
        priceLookupKey: args.priceLookupKey,
        userId: userInfo._id,
      },
      successUrl: successUrlWithHash.toString(),
    });

    if (!session.url) {
      throw new ConvexError({
        code: BILLING_ERROR_CODE.CHECKOUT_FAILED,
        message: "Failed to create checkout session",
      });
    }

    return { url: session.url };
  },
  returns: v.object({ url: v.string() }),
});

/**
 * Generate customer portal URL for managing subscription
 */
export const generateCustomerPortalUrl = action({
  args: {
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current user (throws if not authenticated)
    const userInfo = await ctx.runQuery(
      internal.billing.queries.requireCurrentUserForBilling
    );

    // Get or create Stripe customer with caching
    const customerId = await getOrCreateStripeCustomerWithCache(ctx, userInfo);

    // Create customer portal session using Stripe SDK directly
    const stripeClient = getStripeClient();
    const portalConfigurationId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
    const portalSession = await stripeClient.billingPortal.sessions.create({
      ...(portalConfigurationId
        ? { configuration: portalConfigurationId }
        : {}),
      customer: customerId,
      return_url: args.returnUrl ?? APP_URL,
    });

    return { url: portalSession.url };
  },
  returns: v.union(v.object({ url: v.string() }), v.null()),
});

/**
 * Cancel current subscription
 * Uses Stripe's cancel at period end by default
 */
export const cancelCurrentSubscription = action({
  args: {
    cancelImmediately: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get current user (throws if not authenticated)
    const userInfo = await ctx.runQuery(
      internal.billing.queries.requireCurrentUserForBilling
    );

    // Get user's active subscription from the Stripe component
    const subscriptions = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId: userInfo._id }
    );

    const activeSubscription = subscriptions.find(
      (sub: { status: string }) =>
        sub.status === "active" || sub.status === "trialing"
    );

    if (!activeSubscription) {
      throw new ConvexError({
        code: BILLING_ERROR_CODE.SUBSCRIPTION_CANCEL_FAILED,
        message: "No active subscription found",
      });
    }

    // Cancel the subscription
    const stripeClient = getStripeClient();
    if (args.cancelImmediately) {
      // Immediately cancel and revoke access
      await stripeClient.subscriptions.cancel(
        activeSubscription.stripeSubscriptionId
      );
    } else {
      // Cancel at period end (user keeps access until billing period ends)
      await stripeClient.subscriptions.update(
        activeSubscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );
    }

    return null;
  },
  returns: v.null(),
});

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export const reactivateSubscription = action({
  args: {},
  handler: async (ctx) => {
    // Get current user (throws if not authenticated)
    const userInfo = await ctx.runQuery(
      internal.billing.queries.requireCurrentUserForBilling
    );

    // Get user's subscription that's set to cancel
    const subscriptions = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId: userInfo._id }
    );

    const cancelingSubscription = subscriptions.find(
      (sub: { status: string; cancelAtPeriodEnd?: boolean }) =>
        (sub.status === "active" || sub.status === "trialing") &&
        sub.cancelAtPeriodEnd
    );

    if (!cancelingSubscription) {
      throw new ConvexError({
        code: BILLING_ERROR_CODE.SUBSCRIPTION_CANCEL_FAILED,
        message: "No subscription found that is set to cancel",
      });
    }

    // Reactivate the subscription
    await stripe.reactivateSubscription(ctx, {
      stripeSubscriptionId: cancelingSubscription.stripeSubscriptionId,
    });

    return null;
  },
  returns: v.null(),
});

/**
 * Sync subscription status from Stripe API.
 * Called when user returns from checkout and webhook hasn't arrived yet.
 * Saves what Stripe returns, so the app does not depend on the webhook.
 *
 * @see https://raw.githubusercontent.com/t3dotgg/stripe-recommendations/refs/heads/main/README.md
 */
export const syncSubscriptionFromStripe = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{ success: boolean; hasActiveSubscription: boolean }> => {
    // Get current user (throws if not authenticated)
    const userInfo = await ctx.runQuery(
      internal.billing.queries.requireCurrentUserForBilling
    );

    const customerId = userInfo.stripeCustomerId;

    if (!customerId) {
      // No Stripe customer exists - user has never subscribed
      return { hasActiveSubscription: false, success: true };
    }

    const result = await tryCatch(
      (async () => {
        const subscriptions = await listStripeSubscriptions(customerId);
        await saveSubscriptions(ctx, subscriptions);
        return subscriptions;
      })()
    );

    if (result.error) {
      console.error(
        "[syncSubscriptionFromStripe] Failed to sync subscriptions:",
        result.error.message
      );
      return { hasActiveSubscription: false, success: false };
    }

    return {
      hasActiveSubscription: result.data.some((subscription) =>
        PRO_SUBSCRIPTION_STATUSES.includes(subscription.status)
      ),
      success: true,
    };
  },
  returns: v.object({
    hasActiveSubscription: v.boolean(),
    success: v.boolean(),
  }),
});
