import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { polar } from "./index";

/**
 * Export Polar API functions
 */
export const {
	changeCurrentSubscription,
	cancelCurrentSubscription,
	getConfiguredProducts,
	listAllProducts,
	generateCheckoutLink,
	generateCustomerPortalUrl,
} = polar.api();

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
