import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { internalQuery, query } from "../_generated/server";
import { authKit } from "../auth/index";
import {
	type ProductKey,
	SubscriptionInterval,
	SubscriptionTier,
} from "./constants";
import { polar } from "./index";
import type { UserSubscriptionStatus } from "./types";

////////////////////////////////////////////////////////////
// Get current user's subscription status
////////////////////////////////////////////////////////////
export const getCurrentSubscriptionStatus = query({
	args: {},
	handler: async (ctx): Promise<UserSubscriptionStatus | null> => {
		const authUser = await authKit.getAuthUser(ctx);

		if (!authUser) {
			return null;
		}

		const user = await ctx.db
			.query("users")
			.withIndex("authId", (q) => q.eq("authId", authUser.id))
			.unique();

		if (!user) {
			return null;
		}

		return getSubscriptionStatusForUser(ctx, user._id);
	},
});

////////////////////////////////////////////////////////////
// Get subscription status for a specific user (internal)
////////////////////////////////////////////////////////////
export const getSubscriptionStatusByUserId = internalQuery({
	args: {
		userId: v.id("users"),
	},
	handler: async (ctx, args): Promise<UserSubscriptionStatus> => {
		return getSubscriptionStatusForUser(ctx, args.userId);
	},
});

////////////////////////////////////////////////////////////
// Helper: Get subscription status for a user
////////////////////////////////////////////////////////////
async function getSubscriptionStatusForUser(
	ctx: Parameters<typeof polar.getCurrentSubscription>[0],
	userId: Id<"users">,
): Promise<UserSubscriptionStatus> {
	// Get the current subscription from Polar
	// This returns null if the user has no active subscription (= free tier)
	const subscription = await polar.getCurrentSubscription(ctx, { userId });

	// No subscription = free tier
	if (!subscription) {
		return {
			tier: SubscriptionTier.FREE,
			isPro: false,
			isFree: true,
			productKey: null,
			interval: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			status: null,
		};
	}

	// Determine interval from product key
	// productKey is the key from the products map (e.g., "proMonthly", "proYearly")
	const interval =
		subscription.productKey === "proYearly"
			? SubscriptionInterval.YEAR
			: SubscriptionInterval.MONTH;

	return {
		tier: SubscriptionTier.PRO,
		isPro: true,
		isFree: false,
		productKey: (subscription.productKey as ProductKey) ?? null,
		interval,
		currentPeriodEnd: subscription.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
		status: subscription.status ?? null,
	};
}
