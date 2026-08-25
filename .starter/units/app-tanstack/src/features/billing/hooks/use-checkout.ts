import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import type { StripePriceLookupKey } from "@repo/backend/convex/billing/types";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

interface CheckoutOptions {
  priceLookupKey: StripePriceLookupKey;
  successUrl?: string;
}

/**
 * Get the default checkout success URL.
 * Uses /account/billing/checkout-success for post-checkout subscription verification.
 */
function getDefaultSuccessUrl(): string {
  return `${window.location.origin}/account/billing/checkout-success`;
}

/**
 * Checkout with Stripe
 */
export function useCheckout() {
  const generateCheckoutLink = useConvexAction(
    api.billing.actions.generateCheckoutLink
  );

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async ({ priceLookupKey, successUrl }: CheckoutOptions) => {
      const { url } = await generateCheckoutLink({
        priceLookupKey,
        successUrl: successUrl ?? getDefaultSuccessUrl(),
      });
      return { url };
    },
    onError: (err) => {
      console.error("Checkout failed:", getErrorMessage(err));
    },
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  return {
    checkout: mutateAsync,
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
  };
}
