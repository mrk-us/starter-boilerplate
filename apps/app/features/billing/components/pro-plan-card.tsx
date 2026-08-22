"use client";

import {
	STRIPE_PRICE_LOOKUP_KEY,
	SUBSCRIPTION_PRICING,
} from "@repo/backend/convex/billing/constants";
import {
	Badge,
	Button,
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui/components";
import { CheckoutButton } from "./checkout-button";

type ProPlanCardProps = {
	isCurrentPlan: boolean;
	billingInterval: "month" | "year";
};

function formatPrice(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

export function ProPlanCard({
	isCurrentPlan,
	billingInterval,
}: ProPlanCardProps) {
	const isYearly = billingInterval === "year";
	const price = isYearly
		? SUBSCRIPTION_PRICING.PRO_YEARLY
		: SUBSCRIPTION_PRICING.PRO_MONTHLY;
	const monthlyEquivalent = isYearly
		? SUBSCRIPTION_PRICING.PRO_YEARLY / 12
		: SUBSCRIPTION_PRICING.PRO_MONTHLY;
	const priceLookupKey = isYearly
		? STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY
		: STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY;

	return (
		<Card className={`relative ${isCurrentPlan ? "opacity-75" : ""}`}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Pro</CardTitle>
					{isCurrentPlan && <Badge variant="outline">Current</Badge>}
				</div>
				<CardDescription>
					<div className="flex items-center">
						<span className="text-2xl font-bold text-foreground">
							{formatPrice(monthlyEquivalent)}
						</span>
						<span className="text-white/50 ml-1">/ mo</span>
					</div>

					{isYearly ? (
						<span className="text-xs text-white/50">
							(billed yearly at {formatPrice(price)})
						</span>
					) : (
						<span className="text-xs text-white/50">(billed monthly)</span>
					)}
				</CardDescription>
			</CardHeader>

			<CardFooter>
				{isCurrentPlan ? (
					<Button variant="outline" className="w-full" disabled>
						Current Plan
					</Button>
				) : (
					<CheckoutButton
						priceLookupKey={priceLookupKey}
						variant="default"
						className="w-full"
					>
						Upgrade to Pro
					</CheckoutButton>
				)}
			</CardFooter>
		</Card>
	);
}
