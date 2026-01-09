import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { polar } from "./index";

////////////////////////////////////////////////////////////
// Export Polar API functions
// These are used by the frontend checkout and portal components
////////////////////////////////////////////////////////////
export const {
	/** Change the current user's subscription to a different product */
	changeCurrentSubscription,
	/** Cancel the current user's subscription */
	cancelCurrentSubscription,
	/** Get configured products with their Polar IDs */
	getConfiguredProducts,
	/** List all products from Polar */
	listAllProducts,
	/** Generate a checkout link for purchasing a subscription */
	generateCheckoutLink,
	/** Generate a customer portal URL for managing subscriptions */
	generateCustomerPortalUrl,
} = polar.api();

////////////////////////////////////////////////////////////
// Sync products from Polar (run once after setting up products)
////////////////////////////////////////////////////////////
export const syncProducts = internalAction({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		await polar.syncProducts(ctx);
		return null;
	},
});

////////////////////////////////////////////////////////////
// Manual sync products (public, for admin use)
////////////////////////////////////////////////////////////
export const syncProductsManual = action({
	args: {},
	returns: v.null(),
	handler: async (ctx) => {
		// Note: In production, you'd want to add admin authentication here
		await polar.syncProducts(ctx);
		return null;
	},
});
