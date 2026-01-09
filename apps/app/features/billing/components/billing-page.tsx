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

// Feature lists for each tier
const FREE_FEATURES = ["Basic features", "Community support", "Limited usage"];

const PRO_FEATURES = [
	"All Free features",
	"Priority support",
	"Unlimited usage",
	"Advanced analytics",
	"API access",
];

export function BillingPage() {
	const { isLoading, isFree, isPro } = useSubscription();
	const products = useQuery(api.billing.actions.getConfiguredProducts);

	const isLoadingProducts = products === undefined;

	return (
		<main className="flex flex-col mx-auto max-w-4xl gap-8 p-6">
			<div>
				<h1 className="text-2xl font-bold">Billing</h1>
				<p className="text-white/50 mt-1">
					Manage your subscription and billing information
				</p>
			</div>

			{/* Current Plan Section */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Your Plan</h2>
					<ManageSubscription />
				</div>
				<CurrentPlan />
				<CancelSubscription />
			</section>

			{/* Available Plans Section */}
			<section className="space-y-4">
				<h2 className="text-lg font-semibold">Available Plans</h2>
				<p className="text-white/50 text-sm">
					Choose the plan that best fits your needs
				</p>

				{isLoading || isLoadingProducts ? (
					<div className="grid gap-4 md:grid-cols-2">
						<PlanCardSkeleton />
						<PlanCardSkeleton />
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{/* Free Plan */}
						<FreePlanCard features={FREE_FEATURES} isCurrentPlan={isFree} />

						{/* Pro Plan - shows both monthly and yearly options in checkout */}
						<ProPlanCard
							monthlyPrice={Pricing.PRO_MONTHLY}
							yearlyPrice={Pricing.PRO_YEARLY}
							productIds={[
								products?.proMonthly?.id ?? "",
								products?.proYearly?.id ?? "",
							].filter(Boolean)}
							features={PRO_FEATURES}
							isCurrentPlan={isPro}
						/>
					</div>
				)}
			</section>

			{/* FAQ or Additional Info */}
			<section className="space-y-4 text-sm text-white/50">
				<h3 className="font-medium text-foreground">
					Frequently Asked Questions
				</h3>
				<div className="space-y-3">
					<div>
						<p className="font-medium text-white/70">
							Can I switch plans anytime?
						</p>
						<p>
							Yes, you can upgrade or downgrade your plan at any time. Changes
							take effect immediately.
						</p>
					</div>
					<div>
						<p className="font-medium text-white/70">
							What happens when I cancel?
						</p>
						<p>
							Your subscription remains active until the end of your billing
							period. After that, you'll be moved to the Free plan.
						</p>
					</div>
					<div>
						<p className="font-medium text-white/70">Do you offer refunds?</p>
						<p>
							We offer a 14-day money-back guarantee for new subscribers.
							Contact support for assistance.
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}

function PlanCardSkeleton() {
	return (
		<div className="rounded-[20px] bg-card p-4 animate-pulse">
			<div className="h-6 bg-white/10 rounded w-1/2 mb-2" />
			<div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
			<div className="space-y-2">
				<div className="h-4 bg-white/10 rounded w-full" />
				<div className="h-4 bg-white/10 rounded w-full" />
				<div className="h-4 bg-white/10 rounded w-3/4" />
			</div>
			<div className="h-8 bg-white/10 rounded w-full mt-4" />
		</div>
	);
}
