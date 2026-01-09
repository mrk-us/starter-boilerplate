"use client";

import type { UserSubscriptionStatus } from "@repo/backend/convex/billing/types";
import { useCurrentUser } from "@/features/user/hooks";

type UseSubscriptionReturn = {
	isLoading: boolean;
	isAuthenticated: boolean;
	subscription: UserSubscriptionStatus | null;
	isPro: boolean;
	isFree: boolean;
	tier: UserSubscriptionStatus["tier"];
	productKey: UserSubscriptionStatus["productKey"];
	interval: UserSubscriptionStatus["interval"];
	currentPeriodEnd: UserSubscriptionStatus["currentPeriodEnd"];
	cancelAtPeriodEnd: boolean;
	status: UserSubscriptionStatus["status"];
};

/**
 * Get current user's subscription status
 */
export function useSubscription(): UseSubscriptionReturn {
	const { user, isLoading, isAuthenticated } = useCurrentUser();

	const subscription = user?.subscription ?? null;
	const isPro = subscription?.isPro ?? false;

	return {
		isLoading,
		isAuthenticated,
		subscription,
		isPro,
		isFree: !isPro,
		tier: subscription?.tier ?? "free",
		productKey: subscription?.productKey ?? null,
		interval: subscription?.interval ?? null,
		currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
		cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
		status: subscription?.status ?? null,
	};
}
