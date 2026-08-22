"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

/**
 * Cancel user's subscription
 */
export function useCancelSubscription() {
  const cancelSubscription = useConvexAction(
    api.billing.actions.cancelCurrentSubscription
  );

  const { mutateAsync, isPending, error } = useMutation<void, Error, boolean>({
    mutationFn: async (cancelImmediately = false) => {
      await cancelSubscription({ cancelImmediately });
    },
    onError: (err) => {
      console.error("Cancel subscription failed:", getErrorMessage(err));
    },
  });

  return {
    cancel: mutateAsync,
    error: error ? getErrorMessage(error) : null,
    isPending,
  };
}

/**
 * Reactivate a subscription that was set to cancel
 */
export function useReactivateSubscription() {
  const reactivateSubscription = useConvexAction(
    api.billing.actions.reactivateSubscription
  );

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async () => {
      await reactivateSubscription({});
    },
    onError: (err) => {
      console.error("Reactivate subscription failed:", getErrorMessage(err));
    },
  });

  return {
    error: error ? getErrorMessage(error) : null,
    isPending,
    reactivate: mutateAsync,
  };
}

/**
 * Combined hook for billing actions
 */
export function useBillingActions() {
  const {
    cancel,
    isPending: isCancelPending,
    error: cancelError,
  } = useCancelSubscription();
  const {
    reactivate,
    isPending: isReactivatePending,
    error: reactivateError,
  } = useReactivateSubscription();

  return {
    cancel,
    error: cancelError ?? reactivateError,
    isPending: isCancelPending || isReactivatePending,
    reactivate,
  };
}
