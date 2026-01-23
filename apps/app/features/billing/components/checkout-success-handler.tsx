"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage, tryCatch } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Handles post-checkout subscription sync.
 *
 * Compares the pre-checkout hash (from URL) with the current subscription hash.
 * If they differ, the webhook already updated the state - redirect immediately.
 * If they match, call syncSubscriptionFromStripe to verify with Stripe API, then redirect.
 *
 * @see https://raw.githubusercontent.com/t3dotgg/stripe-recommendations/refs/heads/main/README.md
 */
export function CheckoutSuccessHandler() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const preCheckoutHash = searchParams.get("preCheckoutHash");

	const [status, setStatus] = useState<"checking" | "syncing" | "redirecting">(
		"checking",
	);
	const [error, setError] = useState<string | null>(null);
	const hasStartedRef = useRef(false);

	// Get current subscription hash from Convex
	const currentHash = useConvexQuery(api.billing.queries.getSubscriptionHash);

	// Sync action
	const syncAction = useConvexAction(
		api.billing.actions.syncSubscriptionFromStripe,
	);

	const { mutateAsync: syncFromStripe } = useMutation({
		mutationFn: async () => {
			const result = await syncAction({});
			return result;
		},
	});

	const handleCheckoutSuccess = useCallback(async () => {
		// Prevent multiple executions
		if (hasStartedRef.current) return;
		hasStartedRef.current = true;

		// If no pre-checkout hash, just redirect (shouldn't happen normally)
		if (!preCheckoutHash) {
			setStatus("redirecting");
			router.replace("/account/billing");
			return;
		}

		// Check if webhook already updated the subscription
		if (currentHash !== preCheckoutHash) {
			// Hash changed - webhook beat us here, redirect immediately
			console.log("Hash changed - webhook beat us here, redirecting");
			setStatus("redirecting");
			router.replace("/account/billing");
			return;
		}

		// Hash unchanged - need to sync from Stripe API
		setStatus("syncing");
		console.log("Hash unchanged - need to sync from Stripe API");

		const { data, error: syncError } = await tryCatch(syncFromStripe());

		if (syncError) {
			setError(getErrorMessage(syncError));
			// Still redirect after a delay even on error
			setTimeout(() => {
				router.replace("/account/billing");
			}, 2000);
			return;
		}

		if (data?.hasActiveSubscription) {
			// Subscription confirmed with Stripe API
			setStatus("redirecting");
			router.replace("/account/billing");
		} else {
			// No active subscription found - might be a timing issue
			// Redirect anyway and let the billing page handle it
			setStatus("redirecting");
			router.replace("/account/billing");
		}
	}, [preCheckoutHash, currentHash, syncFromStripe, router]);

	// Start the check when currentHash is loaded
	useEffect(() => {
		// Wait for currentHash to be loaded (not undefined)
		if (currentHash === undefined) return;

		handleCheckoutSuccess();
	}, [currentHash, handleCheckoutSuccess]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
			<div className="flex flex-col items-center gap-2">
				{status === "checking" && (
					<>
						<div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
						<p className="text-muted-foreground">
							Verifying your subscription...
						</p>
					</>
				)}
				{status === "syncing" && (
					<>
						<div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
						<p className="text-muted-foreground">Confirming with Stripe...</p>
					</>
				)}
				{status === "redirecting" && (
					<>
						<div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
						<p className="text-muted-foreground">Redirecting to billing...</p>
					</>
				)}
				{error && (
					<p className="text-destructive text-sm mt-2">
						{error}. Redirecting...
					</p>
				)}
			</div>
		</div>
	);
}
