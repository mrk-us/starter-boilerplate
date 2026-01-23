"use client";

import type { UserSubscription } from "@repo/backend/convex/billing/types";
import { useCurrentUser } from "@/features/user/hooks";

/**
 * Get current user's subscription status
 */
export function useSubscription() {
	const { user } = useCurrentUser();

	if (!user) throw new Error("User not found");

	return {
		plan: user.subscription.plan,
		interval: user.subscription.interval,
		status: user.subscription.status,
		currentPeriodEnd: user.subscription.currentPeriodEnd,
		cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
	} as UserSubscription;
}
