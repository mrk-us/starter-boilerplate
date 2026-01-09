"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";

/**
 * Hook for billing actions (upgrade, downgrade, cancel)
 */
export function useBillingActions() {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const changeSubscription = useAction(
		api.billing.actions.changeCurrentSubscription,
	);
	const cancelSubscription = useAction(
		api.billing.actions.cancelCurrentSubscription,
	);

	// Get configured products to get product IDs
	const products = useQuery(api.billing.actions.getConfiguredProducts);

	const upgrade = async (productId: string) => {
		setIsPending(true);
		setError(null);
		try {
			await changeSubscription({ productId });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to upgrade subscription";
			setError(message);
			throw err;
		} finally {
			setIsPending(false);
		}
	};

	const cancel = async (revokeImmediately = false) => {
		setIsPending(true);
		setError(null);
		try {
			await cancelSubscription({ revokeImmediately });
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to cancel subscription";
			setError(message);
			throw err;
		} finally {
			setIsPending(false);
		}
	};

	return {
		upgrade,
		cancel,
		isPending,
		error,
		products,
		clearError: () => setError(null),
	};
}
