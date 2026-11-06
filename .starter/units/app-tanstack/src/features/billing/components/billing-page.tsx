import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import { Label, Switch } from "@repo/ui/components";
import { useState } from "react";
import {
  CancelSubscription,
  CurrentPlan,
  FreePlanCard,
  ManageSubscription,
  ProPlanCard,
  ResumeSubscription,
} from "@/features/billing/components";
import { useSubscription } from "@/features/billing/hooks";
import { SectionSpinner } from "@/features/shared/components/section-spinner";

export function BillingPage() {
  const { plan, interval, isLoading, status } = useSubscription();

  const [isYearly, setIsYearly] = useState(true);

  // Show loading while subscription data loads
  if (isLoading) {
    return <SectionSpinner />;
  }

  // A subscription that needs a payment gives no Pro access, but it is still the
  // user's plan, and a second checkout is refused.
  const hasSubscription = status !== null;

  const billingInterval = () => {
    if (!(hasSubscription && interval)) {
      if (isYearly) {
        return "year";
      }
      return "month";
    }

    return interval;
  };

  const PAYGATE = plan === SUBSCRIPTION_PLAN.PRO;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-8 p-6">
      <div>
        <h1 className="font-medium text-xl">Billing</h1>
      </div>

      {/* Current Plan Section */}
      <section className="space-y-4">
        <ManageSubscription />

        <CurrentPlan />
        <CancelSubscription />
        <ResumeSubscription />
      </section>

      {PAYGATE && (
        <section className="space-y-4">
          <div className="font-medium text-lg">This is a Pro feature</div>
        </section>
      )}

      {/* Available Plans Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-lg">Plans</h2>

          {!hasSubscription && (
            <div className="flex items-center gap-2">
              <Label
                className={`text-sm ${isYearly ? "text-muted-foreground" : "text-foreground"}`}
                htmlFor="billing-toggle"
              >
                Monthly
              </Label>
              <Switch
                checked={isYearly}
                id="billing-toggle"
                onCheckedChange={setIsYearly}
              />
              <Label
                className={`text-sm ${isYearly ? "text-foreground" : "text-muted-foreground"}`}
                htmlFor="billing-toggle"
              >
                Yearly
              </Label>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FreePlanCard isCurrentPlan={!hasSubscription} />
          <ProPlanCard
            billingInterval={billingInterval()}
            isCurrentPlan={hasSubscription}
          />
        </div>
      </section>
    </main>
  );
}
