import { v } from "convex/values";
import { components, internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { polar } from "./index";

/**
 * Export Polar API functions (except generateCheckoutLink which we override)
 */
export const {
	changeCurrentSubscription,
	cancelCurrentSubscription,
	getConfiguredProducts,
	listAllProducts,
	generateCustomerPortalUrl,
} = polar.api();

/**
 * Generate checkout link with graceful handling of returning users.
 * Handles the case where a user deleted their account and signed up again
 * with the same email - syncs the existing Polar customer to local db.
 */
export const generateCheckoutLink = action({
	args: {
		productIds: v.array(v.string()),
		origin: v.string(),
		successUrl: v.string(),
		subscriptionId: v.optional(v.string()),
	},
	returns: v.object({ url: v.string() }),
	handler: async (ctx, args) => {
		// Get current user info
		const userInfo = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!userInfo) {
			throw new Error("User not found - must be authenticated");
		}

		// Check if customer exists in local polar db
		const existingLocalCustomer = await ctx.runQuery(
			components.polar.lib.getCustomerByUserId,
			{ userId: userInfo._id },
		);

		// If no local customer, check Polar for existing customer and sync
		if (!existingLocalCustomer) {
			await ctx.runAction(
				internal.billing.nodeHelpers.syncExistingPolarCustomer,
				{
					userId: userInfo._id,
					email: userInfo.email,
				},
			);
		}

		// Create checkout session - customer should exist now (or will be created)
		const checkout = await polar.createCheckoutSession(ctx, {
			productIds: args.productIds,
			userId: userInfo._id,
			email: userInfo.email,
			origin: args.origin,
			successUrl: args.successUrl,
			subscriptionId: args.subscriptionId,
		});

		return { url: checkout.url };
	},
});

/**
 * Sync products from Polar (run once after setting up products)
 */
export const syncProducts = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		await polar.syncProducts(ctx);
		return null;
	},
});

/**
 * Manual sync products
 * Products sync automatically via webhooks, but this can be
 * used to force a sync if needed.
 */
export const syncProductsManual = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		await polar.syncProducts(ctx);
		return null;
	},
});
