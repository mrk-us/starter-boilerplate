import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import { Label, Switch } from "@repo/ui/components";
import { useState } from "react";
import {
  CancelSubscription,
  CurrentPlan,
  FreePlanCard,
  ManageSubscription,
  ProPlanCard,
} from "@/features/billing/components";
import { useSubscription } from "@/features/billing/hooks";
import { SectionSpinner } from "@/features/shared/components";

export function BillingPage() {
  const { plan, interval, isLoading } = useSubscription();

  const [isYearly, setIsYearly] = useState(true);

  // Show loading while subscription data loads
  if (isLoading) {
    return <SectionSpinner />;
  }

  const billingInterval = () => {
    if (plan === SUBSCRIPTION_PLAN.FREE || !interval) {
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

          {plan === SUBSCRIPTION_PLAN.FREE && (
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
          <FreePlanCard isCurrentPlan={plan === SUBSCRIPTION_PLAN.FREE} />
          <ProPlanCard
            billingInterval={billingInterval()}
            isCurrentPlan={plan === SUBSCRIPTION_PLAN.PRO}
          />
        </div>
      </section>
    </main>
  );
}
