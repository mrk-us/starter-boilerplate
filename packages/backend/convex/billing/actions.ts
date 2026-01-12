import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { components, internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import {
	BillingErrorCode,
	ErrorMessage,
	UserErrorCode,
} from "../errors/constants";
import { polar } from "./index";

/**
 * Export Polar API functions
 */
export const {
	changeCurrentSubscription,
	cancelCurrentSubscription,
	getConfiguredProducts,
	listAllProducts,
	generateCustomerPortalUrl,
} = polar.api();

/**
 * Generate checkout link with returning user handling
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
		// Get current user
		const userInfo = await ctx.runQuery(
			internal.users.queries.getCurrentUserForBilling,
		);

		if (!userInfo) {
			throw new ConvexError({
				code: UserErrorCode.USER_NOT_FOUND,
				message: ErrorMessage.NOT_AUTHENTICATED,
			});
		}

		// Check if customer exists locally
		const existingLocalCustomer = await ctx.runQuery(
			components.polar.lib.getCustomerByUserId,
			{ userId: userInfo._id },
		);

		// Sync existing Polar customer if not found locally
		if (!existingLocalCustomer) {
			await ctx.runAction(
				internal.billing.nodeHelpers.syncExistingPolarCustomer,
				{
					userId: userInfo._id,
					email: userInfo.email,
				},
			);
		}

		// Create checkout session
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
 * Sync products from Polar (run after setting up products)
 */
export const syncProducts = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const { error: syncProductsError } = await tryCatch(
			polar.syncProducts(ctx),
		);

		if (syncProductsError) {
			console.error("Failed to sync products:", syncProductsError.message);
			throw new ConvexError({
				code: BillingErrorCode.PRODUCTS_SYNC_FAILED,
				message: ErrorMessage.UNKNOWN,
			});
		}

		return null;
	},
});

/**
 * Manual product sync (products sync automatically via webhooks)
 */
export const syncProductsManual = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		const { error: syncProductsError } = await tryCatch(
			polar.syncProducts(ctx),
		);

		if (syncProductsError) {
			console.error("Failed to sync products:", syncProductsError.message);
			throw new ConvexError({
				code: BillingErrorCode.PRODUCTS_SYNC_FAILED,
				message: ErrorMessage.UNKNOWN,
			});
		}

		return null;
	},
});
