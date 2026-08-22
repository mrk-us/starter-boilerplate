"use client";

import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import { tryCatch } from "@repo/shared/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@repo/ui/components";
import { useState } from "react";
import {
  useCancelSubscription,
  useSubscription,
} from "@/features/billing/hooks";

export function CancelSubscription() {
  const { plan, cancelAtPeriodEnd, isLoading } = useSubscription();
  const { cancel, isPending, error } = useCancelSubscription();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  if (plan !== SUBSCRIPTION_PLAN.PRO || cancelAtPeriodEnd) {
    return null;
  }

  const handleCancel = async () => {
    // Cancel at end of period (not immediately)
    const { error: cancelError } = await tryCatch(cancel(false));

    if (!cancelError) {
      setOpen(false);
    }
    // Error is handled by the hook
  };

  return (
    <div className="mt-6 border-border border-t pt-6">
      <AlertDialog onOpenChange={setOpen} open={open}>
        <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>
          Cancel Subscription
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of your current
              billing period. After that, you&apos;ll be downgraded to the Free
              plan. You can resubscribe at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={handleCancel}
            >
              {isPending ? "Cancelling..." : "Yes, Cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
