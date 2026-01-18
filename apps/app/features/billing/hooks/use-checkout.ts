"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import type { StripePriceLookupKey } from "@repo/backend/convex/billing/constants";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

type CheckoutOptions = {
	priceLookupKey: StripePriceLookupKey;
	successUrl?: string;
};

/**
 * Checkout with Stripe
 */
export function useCheckout() {
	const generateCheckoutLink = useConvexAction(
		api.billing.actions.generateCheckoutLink,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async ({ priceLookupKey, successUrl }: CheckoutOptions) => {
			const { url } = await generateCheckoutLink({
				priceLookupKey,
				successUrl: successUrl ?? window.location.href,
			});
			return { url };
		},
		onSuccess: ({ url }) => {
			window.location.href = url;
		},
		onError: (err) => {
			console.error("Checkout failed:", getErrorMessage(err));
		},
	});

	return {
		checkout: mutateAsync,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
