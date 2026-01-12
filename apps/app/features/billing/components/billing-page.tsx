"use client";

import { api } from "@repo/backend/convex/_generated/api";
import { Pricing } from "@repo/backend/convex/billing/constants";
import { useQuery } from "convex/react";
import {
	CancelSubscription,
	CurrentPlan,
	FreePlanCard,
	ManageSubscription,
	ProPlanCard,
} from "@/features/billing/components";
import { useSubscription } from "@/features/billing/hooks";

export function BillingPage() {
	const { isLoading, isPro } = useSubscription();
	const products = useQuery(api.billing.actions.getConfiguredProducts);

	const isLoadingProducts = products === undefined;

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

			{/* Available Plans Section */}
			<section className="space-y-4">
				<h2 className="text-lg font-medium">Plans</h2>

				{(!isLoading || !isLoadingProducts) && (
					<div className="grid gap-4 md:grid-cols-2">
						<FreePlanCard isCurrentPlan={!isPro} />

						<ProPlanCard
							monthlyPrice={Pricing.PRO_MONTHLY}
							yearlyPrice={Pricing.PRO_YEARLY}
							productIds={[
								products?.proMonthly?.id ?? "",
								products?.proYearly?.id ?? "",
							].filter(Boolean)}
							isCurrentPlan={isPro}
						/>
					</div>
				)}
			</section>
		</main>
	);
}
