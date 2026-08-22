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

type FreePlanCardProps = {
	isCurrentPlan: boolean;
};

export function FreePlanCard({ isCurrentPlan }: FreePlanCardProps) {
	return (
		<Card className={isCurrentPlan ? "" : "opacity-75"}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Free</CardTitle>
					{isCurrentPlan && <Badge variant="default">Current</Badge>}
				</div>
				<CardDescription>
					<div className="flex items-center">
						<span className="text-2xl font-bold text-foreground">$0</span>
					</div>
				</CardDescription>
			</CardHeader>

			<CardFooter>
				{!isCurrentPlan && (
					<Button variant="outline" className="w-full">
						Downgrade
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}
