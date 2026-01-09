"use client";

import { CheckoutLink } from "@convex-dev/polar/react";
import { api } from "@repo/backend/convex/_generated/api";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@repo/ui/components";

type ProPlanCardProps = {
	monthlyPrice: number;
	yearlyPrice: number;
	productIds: string[];
	features: string[];
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
	monthlyPrice,
	yearlyPrice,
	productIds,
	features,
	isCurrentPlan,
}: ProPlanCardProps) {
	const monthlyEquivalentFromYearly = yearlyPrice / 12;

	return (
		<Card
			className={`relative ring-2 ring-primary ${isCurrentPlan ? "opacity-75" : ""}`}
		>
			<div className="absolute -top-3 left-1/2 -translate-x-1/2">
				<Badge variant="default">Most Popular</Badge>
			</div>

			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Pro</CardTitle>
					{isCurrentPlan && <Badge variant="outline">Current</Badge>}
				</div>
				<CardDescription>
					<span className="text-2xl font-bold text-foreground">
						{formatPrice(monthlyEquivalentFromYearly)}
					</span>
					<span className="text-white/50">/mo</span>
					<span className="ml-2 text-xs text-white/50">
						(billed yearly at {formatPrice(yearlyPrice)})
					</span>
					<div className="mt-1 text-sm text-white/50">
						or {formatPrice(monthlyPrice)}/mo billed monthly
					</div>
				</CardDescription>
			</CardHeader>

			<CardContent>
				<ul className="space-y-2">
					{features.map((feature) => (
						<li key={feature} className="flex items-center gap-2">
							<CheckIcon />
							<span className="text-sm">{feature}</span>
						</li>
					))}
				</ul>
			</CardContent>

			<CardFooter>
				{isCurrentPlan ? (
					<Button variant="outline" className="w-full" disabled>
						Current Plan
					</Button>
				) : (
					<CheckoutLink
						polarApi={api.billing.actions}
						productIds={productIds}
						className="w-full"
						embed={false}
					>
						<Button variant="primary" className="w-full">
							Upgrade to Pro
						</Button>
					</CheckoutLink>
				)}
			</CardFooter>
		</Card>
	);
}

function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className="size-4 text-green-500 shrink-0"
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
				clipRule="evenodd"
			/>
		</svg>
	);
}
