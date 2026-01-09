"use client";

import { CustomerPortalLink } from "@convex-dev/polar/react";
import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/ui/components";
import { useSubscription } from "@/features/billing/hooks";

export function ManageSubscription() {
	const { isPro } = useSubscription();

	// Only show for Pro users
	if (!isPro) {
		return null;
	}

	return (
		<CustomerPortalLink polarApi={api.billing.actions}>
			<Button variant="outline" size="sm">
				Manage Subscription
			</Button>
		</CustomerPortalLink>
	);
}
