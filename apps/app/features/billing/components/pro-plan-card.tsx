"use client";

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
	monthlyPrice: number;
	yearlyPrice: number;
	productIds: string[];
	isCurrentPlan: boolean;
};

function formatPrice(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

export function ProPlanCard({
	yearlyPrice,
	productIds,
	isCurrentPlan,
}: ProPlanCardProps) {
	const monthlyEquivalentFromYearly = yearlyPrice / 12;

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
							{formatPrice(monthlyEquivalentFromYearly)}
						</span>

						<span className="text-white/50 ml-1">/ mo</span>
					</div>

					<span className="text-xs text-white/50">
						(billed yearly at {formatPrice(yearlyPrice)})
					</span>
				</CardDescription>
			</CardHeader>

			<CardFooter>
				{isCurrentPlan ? (
					<Button variant="outline" className="w-full" disabled>
						Current Plan
					</Button>
				) : (
					<CheckoutButton productIds={productIds} className="w-full">
						Upgrade to Pro
					</CheckoutButton>
				)}
			</CardFooter>
		</Card>
	);
}
