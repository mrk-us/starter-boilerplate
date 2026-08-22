import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessHandler } from "@/features/billing/components";

export const metadata: Metadata = {
  description: "Verifying your subscription",
  title: "Completing Checkout",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CheckoutSuccessHandler />
    </Suspense>
  );
}
