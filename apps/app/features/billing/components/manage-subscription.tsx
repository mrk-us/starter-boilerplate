"use client";

import { useSubscription } from "@/features/billing/hooks";
import { CustomerPortalButton } from "./customer-portal-button";

export function ManageSubscription() {
	const { isPro } = useSubscription();

	// Only show for Pro users
	if (!isPro) {
		return null;
	}

	return <CustomerPortalButton>Manage Subscription</CustomerPortalButton>;
}
