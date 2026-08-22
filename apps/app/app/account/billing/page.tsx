import type { Metadata } from "next";
import { Suspense } from "react";
import { BillingPage } from "@/features/billing/components";

export const metadata: Metadata = {
  description: "Manage your subscription and billing",
  title: "Billing",
};

export default function Billing() {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  );
}
