"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/utils";

type UseCancelSubscriptionReturn = {
	cancel: () => Promise<void>;
	isPending: boolean;
	error: string | null;
};

/**
 * Cancel user's subscription
 */
export function useCancelSubscription(): UseCancelSubscriptionReturn {
	const cancelSubscription = useConvexAction(
		api.billing.actions.cancelCurrentSubscription,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async () => {
			await cancelSubscription({ revokeImmediately: true });
		},
		onError: (err) => {
			console.error("Cancel subscription failed:", getErrorMessage(err));
		},
	});

	return {
		cancel: mutateAsync,
		isPending,
		error: error ? getErrorMessage(error) : null,
	};
}

type UseChangeSubscriptionReturn = {
	change: (productId: string) => Promise<void>;
	isPending: boolean;
	error: string | null;
};

/**
 * Change user's subscription
 */
export function useChangeSubscription(): UseChangeSubscriptionReturn {
	const changeSubscription = useConvexAction(
		api.billing.actions.changeCurrentSubscription,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (productId: string) => {
			await changeSubscription({ productId });
		},
		onError: (err) => {
			console.error("Change subscription failed:", getErrorMessage(err));
		},
	});

	return {
		change: mutateAsync,
		isPending,
		error: error ? getErrorMessage(error) : null,
	};
}

type UseBillingActionsReturn = {
	cancel: () => Promise<void>;
	upgrade: (productId: string) => Promise<void>;
	isPending: boolean;
	error: string | null;
};

/**
 * Combined hook for billing actions
 */
export function useBillingActions(): UseBillingActionsReturn {
	const {
		cancel,
		isPending: isCancelPending,
		error: cancelError,
	} = useCancelSubscription();
	const {
		change: upgrade,
		isPending: isChangePending,
		error: changeError,
	} = useChangeSubscription();

	return {
		cancel,
		upgrade,
		isPending: isCancelPending || isChangePending,
		error: cancelError ?? changeError,
	};
}
