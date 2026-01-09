"use client";

import { useCurrentUser } from "@/features/user/hooks";

/**
 * Hook to access the current user's subscription status
 */
export function useSubscription() {
	const { user, isLoading, isAuthenticated } = useCurrentUser();

	const subscription = user?.subscription ?? null;

	return {
		isLoading,
		isAuthenticated,
		subscription,
		isPro: subscription?.isPro ?? false,
		isFree: subscription?.isFree ?? true,
		tier: subscription?.tier ?? "free",
		productKey: subscription?.productKey ?? null,
		interval: subscription?.interval ?? null,
		currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
		status: subscription?.status ?? null,
	};
}
