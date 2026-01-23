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
		lookup_keys: [lookupKey],
		active: true,
	});

	if (prices.data.length === 0) {
		throw new ConvexError({
			code: BILLING_ERROR_CODE.CHECKOUT_FAILED,
			message: ERROR_MESSAGE.UNKNOWN,
		});
	}

	return prices.data[0].id;
}

/**
 * Find an existing Stripe customer by email.
 * This prevents duplicate customers when users delete and recreate accounts.
 * @see https://docs.stripe.com/api/customers/list
 */
async function findExistingStripeCustomerByEmail(
	email: string,
): Promise<string | null> {
	const stripeClient = getStripeClient();
	const customers = await stripeClient.customers.list({
		email,
		limit: 1,
	});

	if (customers.data.length > 0) {
		return customers.data[0].id;
	}

	return null;
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
	},
): Promise<string> {
	// Use cached customer ID if available
	if (userInfo.stripeCustomerId) {
		return userInfo.stripeCustomerId;
	}

	// Check if a Stripe customer already exists with this email
	const existingCustomerId = await findExistingStripeCustomerByEmail(
		userInfo.email,
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
			userId: userInfo._id,
			email: userInfo.email,
		});
		customerId = customer.customerId;
	}

	// Cache the customer ID on the user record for future calls
	await ctx.runMutation(internal.users.mutations.updateStripeCustomerId, {
		userId: userInfo._id,
		stripeCustomerId: customerId,
	});

	return customerId;
}

/**
 * Generate checkout link for a subscription
 */
export const generateCheckoutLink = action({
	args: {
		priceLookupKey: v.union(
			v.literal(STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY),
			v.literal(STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY),
		),
		successUrl: v.string(),
		cancelUrl: v.optional(v.string()),
	},
	returns: v.object({ url: v.string() }),
	handler: async (ctx, args) => {
		// Get current user (throws if not authenticated)
		const userInfo = await ctx.runQuery(
			internal.users.queries.requireCurrentUserForBilling,
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
			priceId,
			customerId,
			mode: "subscription",
			successUrl: successUrlWithHash.toString(),
			cancelUrl: args.cancelUrl ?? args.successUrl,
			subscriptionMetadata: {
				userId: userInfo._id,
				priceLookupKey: args.priceLookupKey,
			},
		});

		if (!session.url) {
			throw new ConvexError({
				code: BILLING_ERROR_CODE.CHECKOUT_FAILED,
				message: "Failed to create checkout session",
			});
		}

		return { url: session.url };
	},
});

/**
 * Generate customer portal URL for managing subscription
 */
export const generateCustomerPortalUrl = action({
	args: {
		returnUrl: v.optional(v.string()),
	},
	returns: v.union(v.object({ url: v.string() }), v.null()),
	handler: async (ctx, args) => {
		// Get current user (throws if not authenticated)
		const userInfo = await ctx.runQuery(
			internal.users.queries.requireCurrentUserForBilling,
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
});

/**
 * Cancel current subscription
 * Uses Stripe's cancel at period end by default
 */
export const cancelCurrentSubscription = action({
	args: {
		cancelImmediately: v.optional(v.boolean()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		// Get current user (throws if not authenticated)
		const userInfo = await ctx.runQuery(
			internal.users.queries.requireCurrentUserForBilling,
		);

		// Get user's active subscription from the Stripe component
		const subscriptions = await ctx.runQuery(
			components.stripe.public.listSubscriptionsByUserId,
			{ userId: userInfo._id },
		);

		const activeSubscription = subscriptions.find(
			(sub: { status: string }) =>
				sub.status === "active" || sub.status === "trialing",
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
				activeSubscription.stripeSubscriptionId,
			);
		} else {
			// Cancel at period end (user keeps access until billing period ends)
			await stripeClient.subscriptions.update(
				activeSubscription.stripeSubscriptionId,
				{ cancel_at_period_end: true },
			);
		}

		return null;
	},
});

/**
 * Internal: Cancel subscription by user ID
 * Used by deleteUserInternal when we don't have auth context (e.g. webhook)
 */
export const cancelSubscriptionByUserId = internalAction({
	args: {
		userId: v.id("users"),
		cancelImmediately: v.optional(v.boolean()),
	},
	returns: v.object({ success: v.boolean() }),
	handler: async (ctx, args) => {
		// Get user's active subscription from the Stripe component
		const subscriptions = await ctx.runQuery(
			components.stripe.public.listSubscriptionsByUserId,
			{ userId: args.userId },
		);

		const activeSubscription = subscriptions.find(
			(sub: { status: string }) =>
				sub.status === "active" || sub.status === "trialing",
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
						activeSubscription.stripeSubscriptionId,
					)
				: stripeClient.subscriptions.update(
						activeSubscription.stripeSubscriptionId,
						{ cancel_at_period_end: true },
					),
		);

		if (error) {
			console.error(
				"[cancelSubscriptionByUserId] Failed to cancel subscription:",
				error.message,
			);
			return { success: false };
		}

		return { success: true };
	},
});

/**
 * Reactivate a subscription that was set to cancel at period end
 */
export const reactivateSubscription = action({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Get current user (throws if not authenticated)
		const userInfo = await ctx.runQuery(
			internal.users.queries.requireCurrentUserForBilling,
		);

		// Get user's subscription that's set to cancel
		const subscriptions = await ctx.runQuery(
			components.stripe.public.listSubscriptionsByUserId,
			{ userId: userInfo._id },
		);

		const cancelingSubscription = subscriptions.find(
			(sub: { status: string; cancelAtPeriodEnd?: boolean }) =>
				(sub.status === "active" || sub.status === "trialing") &&
				sub.cancelAtPeriodEnd,
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
});

/**
 * Get available prices for display
 */
export const getAvailablePrices = action({
	args: {},
	returns: v.array(
		v.object({
			id: v.string(),
			lookupKey: v.union(v.string(), v.null()),
			unitAmount: v.union(v.number(), v.null()),
			currency: v.string(),
			interval: v.union(v.string(), v.null()),
			productId: v.string(),
		}),
	),
	handler: async () => {
		const stripeClient = getStripeClient();

		// Get prices by lookup keys
		const prices = await stripeClient.prices.list({
			lookup_keys: [
				STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY,
				STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY,
			],
			active: true,
			expand: ["data.product"],
		});

		return prices.data.map((price) => ({
			id: price.id,
			lookupKey: price.lookup_key,
			unitAmount: price.unit_amount,
			currency: price.currency,
			interval: price.recurring?.interval ?? null,
			productId:
				typeof price.product === "string" ? price.product : price.product.id,
		}));
	},
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
	returns: v.object({
		success: v.boolean(),
		hasActiveSubscription: v.boolean(),
	}),
	handler: async (
		ctx,
	): Promise<{ success: boolean; hasActiveSubscription: boolean }> => {
		// Get current user (throws if not authenticated)
		const userInfo = await ctx.runQuery(
			internal.users.queries.requireCurrentUserForBilling,
		);

		// Use cached customer ID if available, otherwise lookup by email
		let customerId: string | null | undefined = userInfo.stripeCustomerId;

		if (!customerId) {
			customerId = await findExistingStripeCustomerByEmail(userInfo.email);
		}

		if (!customerId) {
			// No Stripe customer exists - user has never subscribed
			return { success: true, hasActiveSubscription: false };
		}

		// Fetch latest subscription directly from Stripe API
		const stripeClient = getStripeClient();
		const result = await tryCatch(
			stripeClient.subscriptions.list({
				customer: customerId,
				status: "all",
				limit: 1,
				expand: ["data.default_payment_method"],
			}),
		);

		if (result.error) {
			console.error(
				"[syncSubscriptionFromStripe] Failed to fetch subscriptions:",
				result.error.message,
			);
			return { success: false, hasActiveSubscription: false };
		}

		const stripeSubscriptions = result.data;

		if (stripeSubscriptions.data.length === 0) {
			return { success: true, hasActiveSubscription: false };
		}

		const subscription = stripeSubscriptions.data[0];
		const isActive: boolean =
			subscription.status === "active" || subscription.status === "trialing";

		return { success: true, hasActiveSubscription: isActive };
	},
});
