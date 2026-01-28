"use client";

import type { UserSubscription } from "@repo/backend/convex/billing/types";
import { useCurrentUser } from "@/features/user/hooks";

type SubscriptionResult = UserSubscription & { isLoading: boolean };

/**
 * Get current user's subscription status
 * Always returns an object (safe to destructure), with isLoading flag
 */
export function useSubscription(): SubscriptionResult {
	const { user, isLoading } = useCurrentUser();

	if (isLoading || !user) {
		return {
			plan: "free",
			interval: null,
			status: null,
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
			isLoading: true,
		};
	}

	return {
		plan: user.subscription.plan,
		interval: user.subscription.interval,
		status: user.subscription.status,
		currentPeriodEnd: user.subscription.currentPeriodEnd,
		cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
		isLoading: false,
	};
}
