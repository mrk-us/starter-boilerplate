"use node";

import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import Stripe from "stripe";
import { components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action, internalAction } from "../_generated/server";
import {
  BILLING_ERROR_CODE,
  ERROR_CODE,
  ERROR_MESSAGE,
} from "../errors/constants";
import { STRIPE_PRICE_LOOKUP_KEY } from "./constants";
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
  return new Stripe(secretKey);
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
 * Find an existing Stripe customer by email.
 * This prevents duplicate customers when users delete and recreate accounts.
 * @see https://docs.stripe.com/api/customers/list
 */
async function findExistingStripeCustomerByEmail(
  email: string
): Promise<string | null> {
  const stripeClient = getStripeClient();
  const customers = await stripeClient.customers.list({
    email,
    limit: 1,
  });

  const [customer] = customers.data;

  return customer?.id ?? null;
}

/**
 * Get or create a Stripe customer with caching.
 * Uses cached stripeCustomerId when available, otherwise looks up/creates and caches.
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

  // Check if a Stripe customer already exists with this email
  const existingCustomerId = await findExistingStripeCustomerByEmail(
    userInfo.email
  );

  let customerId: string;

  if (existingCustomerId) {
    // Reuse existing Stripe customer
    customerId = existingCustomerId;

    // Update the customer's metadata to link to the new user
    const stripeClient = getStripeClient();
    await stripeClient.customers.update(existingCustomerId, {
      metadata: { userId: userInfo._id },
    });
  } else {
    // Create new customer via the Stripe component
    const customer = await stripe.getOrCreateCustomer(ctx, {
      email: userInfo.email,
      userId: userInfo._id,
    });
    ({ customerId } = customer);
  }

  // Cache the customer ID on the user record for future calls
  await ctx.runMutation(internal.users.mutations.updateStripeCustomerId, {
    stripeCustomerId: customerId,
    userId: userInfo._id,
  });

  return customerId;
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
      internal.users.queries.requireCurrentUserForBilling
    );

    // Parallelize: Get subscription hash + price ID + customer ID
    const [currentSubscription, priceId, customerId] = await Promise.all([
      ctx.runQuery(internal.billing.queries.getSubscriptionStatusByUserId, {
        userId: userInfo._id,
      }),
      getPriceIdByLookupKey(args.priceLookupKey),
      getOrCreateStripeCustomerWithCache(ctx, userInfo),
    ]);

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
      internal.users.queries.requireCurrentUserForBilling
    );

    // Get or create Stripe customer with caching
    const customerId = await getOrCreateStripeCustomerWithCache(ctx, userInfo);

    // Create customer portal session using Stripe SDK directly
    const stripeClient = getStripeClient();
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url:
        args.returnUrl ?? process.env.SITE_URL ?? "http://localhost:3000",
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
      internal.users.queries.requireCurrentUserForBilling
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
 * Internal: Cancel subscription by user ID
 * Used by deleteUserInternal when we don't have auth context (e.g. webhook)
 */
export const cancelSubscriptionByUserId = internalAction({
  args: {
    cancelImmediately: v.optional(v.boolean()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user's active subscription from the Stripe component
    const subscriptions = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId: args.userId }
    );

    const activeSubscription = subscriptions.find(
      (sub: { status: string }) =>
        sub.status === "active" || sub.status === "trialing"
    );

    // No subscription to cancel - this is fine (user may never have subscribed)
    if (!activeSubscription) {
      return { success: true };
    }

    // Cancel the subscription
    const stripeClient = getStripeClient();
    const { error } = await tryCatch(
      args.cancelImmediately
        ? stripeClient.subscriptions.cancel(
            activeSubscription.stripeSubscriptionId
          )
        : stripeClient.subscriptions.update(
            activeSubscription.stripeSubscriptionId,
            { cancel_at_period_end: true }
          )
    );

    if (error) {
      console.error(
        "[cancelSubscriptionByUserId] Failed to cancel subscription:",
        error.message
      );
      return { success: false };
    }

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export const reactivateSubscription = action({
  args: {},
  handler: async (ctx) => {
    // Get current user (throws if not authenticated)
    const userInfo = await ctx.runQuery(
      internal.users.queries.requireCurrentUserForBilling
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
 * Get available prices for display
 */
export const getAvailablePrices = action({
  args: {},
  handler: async () => {
    const stripeClient = getStripeClient();

    // Get prices by lookup keys
    const prices = await stripeClient.prices.list({
      active: true,
      expand: ["data.product"],
      lookup_keys: [
        STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY,
        STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY,
      ],
    });

    return prices.data.map((price) => ({
      currency: price.currency,
      id: price.id,
      interval: price.recurring?.interval ?? null,
      lookupKey: price.lookup_key,
      productId:
        typeof price.product === "string" ? price.product : price.product.id,
      unitAmount: price.unit_amount,
    }));
  },
  returns: v.array(
    v.object({
      currency: v.string(),
      id: v.string(),
      interval: v.union(v.string(), v.null()),
      lookupKey: v.union(v.string(), v.null()),
      productId: v.string(),
      unitAmount: v.union(v.number(), v.null()),
    })
  ),
});

/**
 * Sync subscription status from Stripe API.
 * Called when user returns from checkout and webhook hasn't arrived yet.
 * Fetches directly from Stripe to verify subscription exists.
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
      internal.users.queries.requireCurrentUserForBilling
    );

    // Use cached customer ID if available, otherwise lookup by email
    let customerId: string | null | undefined = userInfo.stripeCustomerId;

    if (!customerId) {
      customerId = await findExistingStripeCustomerByEmail(userInfo.email);
    }

    if (!customerId) {
      // No Stripe customer exists - user has never subscribed
      return { hasActiveSubscription: false, success: true };
    }

    // Fetch latest subscription directly from Stripe API
    const stripeClient = getStripeClient();
    const result = await tryCatch(
      stripeClient.subscriptions.list({
        customer: customerId,
        expand: ["data.default_payment_method"],
        limit: 1,
        status: "all",
      })
    );

    if (result.error) {
      console.error(
        "[syncSubscriptionFromStripe] Failed to fetch subscriptions:",
        result.error.message
      );
      return { hasActiveSubscription: false, success: false };
    }

    const stripeSubscriptions = result.data;

    const [subscription] = stripeSubscriptions.data;

    if (!subscription) {
      return { hasActiveSubscription: false, success: true };
    }

    const isActive: boolean =
      subscription.status === "active" || subscription.status === "trialing";

    return { hasActiveSubscription: isActive, success: true };
  },
  returns: v.object({
    hasActiveSubscription: v.boolean(),
    success: v.boolean(),
  }),
});
