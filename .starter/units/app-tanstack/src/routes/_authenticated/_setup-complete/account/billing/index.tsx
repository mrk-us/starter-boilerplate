import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/features/billing/components";

export const Route = createFileRoute(
  "/_authenticated/_setup-complete/account/billing/"
)({
  component: BillingPage,
  head: () => ({
    meta: [
      { content: "Manage your subscription and billing", name: "description" },
      { title: `Billing | ${APP_NAME}` },
    ],
  }),
});
