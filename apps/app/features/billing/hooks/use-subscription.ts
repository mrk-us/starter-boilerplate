"use client";

import { useCurrentUser } from "@/features/user/hooks";

/**
 * Get current user's subscription status
 */
export function useSubscription() {
	const { user, isLoading, isAuthenticated } = useCurrentUser();

	const subscription = user?.subscription ?? null;
	const isPro = subscription?.isPro ?? false;

	return {
		isLoading,
		isAuthenticated,
		subscription,
		isPro,
		tier: subscription?.tier ?? "free",
		productKey: subscription?.productKey ?? null,
		interval: subscription?.interval ?? null,
		currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
		status: subscription?.status ?? null,
	} as const;
}
