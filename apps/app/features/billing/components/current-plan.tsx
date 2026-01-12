"use client";

import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@repo/ui/components";
import { useSubscription } from "@/features/billing/hooks";

function formatDate(dateString: string | null): string {
	if (!dateString) return "";
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function CurrentPlan() {
	const { isLoading, isPro, currentPeriodEnd, cancelAtPeriodEnd, status } =
		useSubscription();

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Current Plan</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	const statusBadge = isPro ? (
		cancelAtPeriodEnd ? (
			<Badge variant="destructive">Cancelling</Badge>
		) : (
			<Badge variant="default">Active</Badge>
		)
	) : (
		<Badge variant="outline">Free</Badge>
	);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Current Plan</CardTitle>
					{statusBadge}
				</div>
				<CardDescription>
					{isPro
						? "You have access to all Pro features"
						: "Upgrade to Pro for more features"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{isPro && (
						<>
							<div className="flex justify-between items-center">
								<span className="text-white/50">Status</span>
								<span className="font-medium capitalize">
									{status ?? "Active"}
								</span>
							</div>

							{currentPeriodEnd && (
								<div className="flex justify-between items-center">
									<span className="text-white/50">
										{cancelAtPeriodEnd ? "Access until" : "Next billing date"}
									</span>
									<span className="font-medium">
										{formatDate(currentPeriodEnd)}
									</span>
								</div>
							)}

							{cancelAtPeriodEnd && (
								<p className="text-amber-500 text-xs mt-2">
									Your subscription will end on {formatDate(currentPeriodEnd)}.
									You can resubscribe anytime.
								</p>
							)}
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
