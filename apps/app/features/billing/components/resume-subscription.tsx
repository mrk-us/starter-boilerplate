"use client";

import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import { tryCatch } from "@repo/shared/utils";
import { Button } from "@repo/ui/components";
import {
  useReactivateSubscription,
  useSubscription,
} from "@/features/billing/hooks";

export function ResumeSubscription() {
  const { plan, cancelAtPeriodEnd, isLoading } = useSubscription();
  const { reactivate, isPending, error } = useReactivateSubscription();

  if (isLoading || plan !== SUBSCRIPTION_PLAN.PRO || !cancelAtPeriodEnd) {
    return null;
  }

  return (
    <div className="mt-6 space-y-2 border-border border-t pt-6">
      <Button
        disabled={isPending}
        onClick={() => tryCatch(reactivate())}
        size="sm"
      >
        {isPending ? "Resuming..." : "Resume Subscription"}
      </Button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
