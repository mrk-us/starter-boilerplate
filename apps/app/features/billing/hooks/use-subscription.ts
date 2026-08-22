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
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      interval: null,
      isLoading: true,
      plan: "free",
      status: null,
    };
  }

  return {
    cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
    currentPeriodEnd: user.subscription.currentPeriodEnd,
    interval: user.subscription.interval,
    isLoading: false,
    plan: user.subscription.plan,
    status: user.subscription.status,
  };
}
