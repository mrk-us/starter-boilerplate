import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getAuthId } from "../auth/helpers";
import { getSubscriptionStatusForUser } from "./helpers";
import { subscriptionStatusSchema } from "./validation";

/**
 * Get current user's subscription status
 */
export const getCurrentSubscriptionStatus = query({
	args: {},
	returns: v.union(subscriptionStatusSchema, v.null()),
	handler: async (ctx) => {
		const authId = await getAuthId(ctx);

		if (!authId) return null;

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authId))
			.unique();

		if (!user) {
			return null;
		}

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
	returns: subscriptionStatusSchema,
	handler: async (ctx, args) => {
		return getSubscriptionStatusForUser(ctx, args.userId);
	},
});
