"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
} from "@repo/ui/components";
import { useState } from "react";
import {
	useCancelSubscription,
	useSubscription,
} from "@/features/billing/hooks";

export function CancelSubscription() {
	const { isPro, cancelAtPeriodEnd } = useSubscription();
	const { cancel, isPending, error } = useCancelSubscription();
	const [open, setOpen] = useState(false);

	// Don't show if user is not Pro or already cancelling
	if (!isPro || cancelAtPeriodEnd) {
		return null;
	}

	const handleCancel = async () => {
		try {
			// Cancel at end of period (not immediately)
			await cancel(false);
			setOpen(false);
		} catch {
			// Error is handled by the hook
		}
	};

	return (
		<div className="mt-6 pt-6 border-t border-border">
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
					Cancel Subscription
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
						<AlertDialogDescription>
							Your subscription will remain active until the end of your current
							billing period. After that, you&apos;ll be downgraded to the Free
							plan. You can resubscribe at any time.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{error && <p className="text-destructive text-sm">{error}</p>}
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Subscription</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancel}
							disabled={isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isPending ? "Cancelling..." : "Yes, Cancel"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
