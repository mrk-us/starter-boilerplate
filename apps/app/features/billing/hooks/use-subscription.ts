"use client";

import { useCurrentUser } from "@/features/user/hooks";

/**
 * Get current user's subscription status
 */
export function useSubscription() {
	const { user } = useCurrentUser();

	if (!user) return {} as const;

	const subscription = user.subscription;

	if (!subscription) return {} as const;

	return {
		plan: subscription.plan,
		interval: subscription.interval,
		status: subscription.status,
		currentPeriodEnd: subscription.currentPeriodEnd,
		cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
	} as const;
}
