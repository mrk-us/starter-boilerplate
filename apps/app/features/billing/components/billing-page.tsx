"use client";

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
			if (isYearly) return "year";
			else return "month";
		}

		return interval;
	};

	const PAYGATE = plan === SUBSCRIPTION_PLAN.PRO;

	return (
		<main className="flex flex-col mx-auto max-w-lg gap-8 p-6">
			<div>
				<h1 className="text-xl font-medium">Billing</h1>
			</div>

			{/* Current Plan Section */}
			<section className="space-y-4">
				<ManageSubscription />

				<CurrentPlan />
				<CancelSubscription />
			</section>

			{PAYGATE && (
				<section className="space-y-4">
					<div className="text-lg font-medium">This is a Pro feature</div>
				</section>
			)}

			{/* Available Plans Section */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-medium">Plans</h2>

					{plan === SUBSCRIPTION_PLAN.FREE && (
						<div className="flex items-center gap-2">
							<Label
								htmlFor="billing-toggle"
								className={`text-sm ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}
							>
								Monthly
							</Label>
							<Switch
								id="billing-toggle"
								checked={isYearly}
								onCheckedChange={setIsYearly}
							/>
							<Label
								htmlFor="billing-toggle"
								className={`text-sm ${isYearly ? "text-foreground" : "text-muted-foreground"}`}
							>
								Yearly
							</Label>
						</div>
					)}
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<FreePlanCard isCurrentPlan={plan === SUBSCRIPTION_PLAN.FREE} />
					<ProPlanCard
						isCurrentPlan={plan === SUBSCRIPTION_PLAN.PRO}
						billingInterval={billingInterval()}
					/>
				</div>
			</section>
		</main>
	);
}
