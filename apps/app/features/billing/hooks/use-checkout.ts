"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared/utils";
import { useMutation } from "@tanstack/react-query";

type CheckoutOptions = {
	productIds: string[];
	successUrl?: string;
};

type UseCheckoutReturn = {
	checkout: (options: CheckoutOptions) => Promise<{ url: string }>;
	isPending: boolean;
	error: Error | undefined;
};

/**
 * Checkout product
 */
export function useCheckout(): UseCheckoutReturn {
	const generateCheckoutLink = useConvexAction(
		api.billing.actions.generateCheckoutLink,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async ({ productIds, successUrl }: CheckoutOptions) => {
			const { url } = await generateCheckoutLink({
				productIds,
				origin: window.location.origin,
				successUrl: successUrl ?? window.location.href,
			});
			return { url };
		},
		onSuccess: ({ url }) => {
			// Redirect to Polar checkout
			window.location.href = url;
		},
		onError: (err) => {
			console.error("Checkout failed:", getErrorMessage(err));
		},
	});

	const checkout = async (options: CheckoutOptions) => {
		return mutateAsync(options);
	};

	return {
		checkout,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
