"use client";

import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import { useSubscription } from "@/features/billing/hooks";
import { CustomerPortalButton } from "./customer-portal-button";

export function ManageSubscription() {
	const { plan } = useSubscription();

	// Only show for Pro users
	if (plan !== SUBSCRIPTION_PLAN.PRO) {
		return null;
	}

	return <CustomerPortalButton>Manage Subscription</CustomerPortalButton>;
}
