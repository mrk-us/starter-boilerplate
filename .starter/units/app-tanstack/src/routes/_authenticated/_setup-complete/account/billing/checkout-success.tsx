import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CheckoutSuccessHandler } from "@/features/billing/components";

export const Route = createFileRoute(
  "/_authenticated/_setup-complete/account/billing/checkout-success"
)({
  component: CheckoutSuccessHandler,
  head: () => ({
    meta: [
      { content: "Verifying your subscription", name: "description" },
      { title: `Completing checkout | ${APP_NAME}` },
    ],
  }),
  validateSearch: z.object({
    // Subscription hash captured before Stripe checkout, used to tell a
    // webhook-applied update apart from one that still needs a manual sync.
    preCheckoutHash: z.string().optional(),
  }),
});
