"use client";

import type { StripePriceLookupKey } from "@repo/backend/convex/billing/types";
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
import { CheckoutButton } from "./checkout-button";

type PlanCardProps = {
	name: string;
	price: number;
	interval: "month" | "year";
	priceLookupKey: StripePriceLookupKey;
	features: string[];
	isCurrentPlan: boolean;
	isPro: boolean;
	isPopular?: boolean;
};

function formatPrice(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

export function PlanCard({
	name,
	price,
	interval,
	priceLookupKey,
	features,
	isCurrentPlan,
	isPro,
	isPopular,
}: PlanCardProps) {
	const monthlyEquivalent = interval === "year" ? price / 12 : price;

	return (
		<Card
			className={`relative ${isPopular ? "ring-2 ring-primary" : ""} ${isCurrentPlan ? "opacity-75" : ""}`}
		>
			{isPopular && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2">
					<Badge variant="default">Most Popular</Badge>
				</div>
			)}

			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{name}</CardTitle>
					{isCurrentPlan && <Badge variant="outline">Current</Badge>}
				</div>
				<CardDescription>
					<span className="text-2xl font-bold text-foreground">
						{formatPrice(price)}
					</span>
					<span className="text-white/50">/{interval}</span>
					{interval === "year" && (
						<span className="ml-2 text-xs text-green-500">
							({formatPrice(monthlyEquivalent)}/mo)
						</span>
					)}
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
				) : isPro ? (
					// User is Pro, show option to switch plans
					<CheckoutButton
						priceLookupKey={priceLookupKey}
						variant="default"
						className="w-full"
					>
						Switch to {name}
					</CheckoutButton>
				) : (
					// User is Free, show upgrade option
					<CheckoutButton
						priceLookupKey={priceLookupKey}
						variant="default"
						className="w-full"
					>
						Upgrade to {name}
					</CheckoutButton>
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
