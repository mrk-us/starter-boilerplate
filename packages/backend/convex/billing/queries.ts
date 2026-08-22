import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getAuthenticatedUser } from "../auth/helpers";
import {
	createSubscriptionHash,
	getSubscriptionStatusForUser,
} from "./helpers";
import { subscriptionSchema } from "./validation";

/**
 * Get current user's subscription status
 */
export const getCurrentSubscriptionStatus = query({
	args: {},
	returns: v.union(subscriptionSchema, v.null()),
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);

		if (!user) return null;

		return getSubscriptionStatusForUser(ctx, user._id);
	},
});

/**
 * Get subscription status for a specific user (internal)
 */
export const getSubscriptionStatusByUserId = internalQuery({
	args: {
		userId: v.id("users"),
	},
	returns: subscriptionSchema,
	handler: async (ctx, args) => {
		return getSubscriptionStatusForUser(ctx, args.userId);
	},
});

/**
 * Get a hash of the current user's subscription state.
 * Used to detect if subscription changed between checkout start and completion.
 */
export const getSubscriptionHash = query({
	args: {},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx) => {
		const user = await getAuthenticatedUser(ctx);

		if (!user) return null;

		const subscription = await getSubscriptionStatusForUser(ctx, user._id);
		return await createSubscriptionHash(subscription);
	},
});
