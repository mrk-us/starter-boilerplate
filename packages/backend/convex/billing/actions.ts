"use node";

import { ConvexError, v } from "convex/values";
import Stripe from "stripe";
import { components, internal } from "../_generated/api";
import { action } from "../_generated/server";
import {
	BILLING_ERROR_CODE,
	ERROR_MESSAGE,
	USER_ERROR_CODE,
} from "../errors/constants";
import { STRIPE_PRICE_LOOKUP_KEYS } from "./constants";
import { stripe } from "./index";

/**
 * Get Stripe client for direct API calls
 */
function getStripeClient() {
	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		throw new Error("STRIPE_SECRET_KEY environment variable is not set");
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
		throw new Error(`No price found for lookup key: ${lookupKey}`);
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
 * Generate checkout link for a subscription
 */
export const generateCheckoutLink = action({
	args: {
		priceLookupKey: v.union(
			v.literal(STRIPE_PRICE_LOOKUP_KEYS.PRO_MONTHLY),
			v.literal(STRIPE_PRICE_LOOKUP_KEYS.PRO_YEARLY),
		),
		successUrl: v.string(),
		cancelUrl: v.optional(v.string()),
	},
	returns: v.object({ url: v.string() }),
	handler: async (ctx, args) => {
		// Get current user
		const userInfo = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!userInfo) {
			throw new ConvexError({
				code: USER_ERROR_CODE.USER_NOT_FOUND,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

		// Check if a Stripe customer already exists with this email
		// This prevents duplicate customers when users delete and recreate accounts
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
				metadata: { convexUserId: userInfo._id },
			});
		} else {
			// Create new customer via the Stripe component
			const customer = await stripe.getOrCreateCustomer(ctx, {
				userId: userInfo._id,
				email: userInfo.email,
			});
			customerId = customer.customerId;
		}

		// Look up the price ID from the lookup key
		const priceId = await getPriceIdByLookupKey(args.priceLookupKey);

		// Create checkout session
		const session = await stripe.createCheckoutSession(ctx, {
			priceId,
			customerId,
			mode: "subscription",
			successUrl: args.successUrl,
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
		// Get current user
		const userInfo = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!userInfo) {
			throw new ConvexError({
				code: USER_ERROR_CODE.USER_NOT_FOUND,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

		// Check if a Stripe customer already exists with this email
		const existingCustomerId = await findExistingStripeCustomerByEmail(
			userInfo.email,
		);

		let customerId: string;

		if (existingCustomerId) {
			customerId = existingCustomerId;
		} else {
			// Create new customer via the Stripe component
			const customer = await stripe.getOrCreateCustomer(ctx, {
				userId: userInfo._id,
				email: userInfo.email,
			});
			customerId = customer.customerId;
		}

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
		// Get current user
		const userInfo = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!userInfo) {
			throw new ConvexError({
				code: USER_ERROR_CODE.USER_NOT_FOUND,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

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
 * Reactivate a subscription that was set to cancel at period end
 */
export const reactivateSubscription = action({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Get current user
		const userInfo = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!userInfo) {
			throw new ConvexError({
				code: USER_ERROR_CODE.USER_NOT_FOUND,
				message: ERROR_MESSAGE.NOT_AUTHENTICATED,
			});
		}

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
				STRIPE_PRICE_LOOKUP_KEYS.PRO_MONTHLY,
				STRIPE_PRICE_LOOKUP_KEYS.PRO_YEARLY,
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
