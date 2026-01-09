"use client";

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

type FreePlanCardProps = {
	features: string[];
	isCurrentPlan: boolean;
};

export function FreePlanCard({ features, isCurrentPlan }: FreePlanCardProps) {
	return (
		<Card className={isCurrentPlan ? "ring-2 ring-primary" : "opacity-75"}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Free</CardTitle>
					{isCurrentPlan && <Badge variant="default">Current</Badge>}
				</div>
				<CardDescription>
					<span className="text-2xl font-bold text-foreground">$0</span>
					<span className="text-white/50">/forever</span>
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
				<Button variant="outline" className="w-full" disabled>
					{isCurrentPlan ? "Current Plan" : "Downgrade"}
				</Button>
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
