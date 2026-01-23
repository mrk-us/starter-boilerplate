import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalQuery, query } from "../_generated/server";
import { getAuthenticatedUser, requireUser } from "../auth/helpers";
import type { UserSubscription } from "../billing/types";

/**
 * Get current user for billing (internal - avoids circular dependency)
 * This query is used by the Stripe billing module to get user info
 * without fetching subscription data (which would create a circular reference)
 */
export const getCurrentUserForBilling = internalQuery({
	args: {},
	handler: async (ctx, _args) => {
		const user = await getAuthenticatedUser(ctx);

		if (!user) return null;

		return {
			_id: user._id,
			email: user.email,
			stripeCustomerId: user.stripeCustomerId,
		};
	},
});

/**
 * Require current user for billing - throws if not authenticated
 * Use this in actions where authentication is required
 */
export const requireCurrentUserForBilling = internalQuery({
	args: {},
	handler: async (ctx, _args) => {
		const user = await requireUser(ctx);

		return {
			_id: user._id,
			email: user.email,
			stripeCustomerId: user.stripeCustomerId,
		};
	},
});

/**
 * Get user by ID (internal)
 */
export const getUserById = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});

/**
 * Get user by email
 */
export const getUserByEmail = internalQuery({
	args: {
		email: v.union(v.string(), v.array(v.string()), v.null()),
	},
	handler: async (ctx, args) => {
		if (!args.email) return null;

		const emailToSearch = Array.isArray(args.email)
			? args.email[0]
			: args.email;

		if (!emailToSearch || typeof emailToSearch !== "string") {
			return null;
		}

		return await ctx.db
			.query("users")
			.withIndex("email", (q) => q.eq("email", emailToSearch))
			.unique();
	},
});

/**
 * Get user by authId
 */
export const getUserByAuthId = internalQuery({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		if (!args.authId) return null;

		// TODO: Can we use a helper here?
		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", args.authId))
			.unique();

		if (!user) return null;

		return {
			...user,
		};
	},
});

/**
 * Get the current db user with subscription status
 * Uses runtime query call to billing module (decoupled from import dependency)
 */
export const getUserWithSubscription = query({
	args: {},
	handler: async (ctx, _args) => {
		const user = await getAuthenticatedUser(ctx);

		if (!user) return null;

		// Generate URL for the profile picture if it exists
		// Priority: custom uploaded picture (Convex storage) > Clerk profile picture
		let profilePictureUrl: string | null | undefined;

		if (user.profilePictureStorageId) {
			profilePictureUrl = await ctx.storage.getUrl(
				user.profilePictureStorageId,
			);
		} else if (user.profilePictureUrl) {
			profilePictureUrl = user.profilePictureUrl;
		}

		// Get subscription status via runtime query (decoupled from billing module)
		const subscription: UserSubscription = await ctx.runQuery(
			internal.billing.queries.getSubscriptionStatusByUserId,
			{ userId: user._id },
		);

		return {
			...user,
			profilePictureUrl,
			subscription,
		};
	},
});
