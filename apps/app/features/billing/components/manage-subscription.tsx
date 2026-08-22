"use client";

import { SUBSCRIPTION_PLAN } from "@repo/backend/convex/billing/constants";
import { useSubscription } from "@/features/billing/hooks";
import { CustomerPortalButton } from "./customer-portal-button";

export function ManageSubscription() {
	const { plan, isLoading } = useSubscription();

	if (isLoading) return null;

	if (plan !== SUBSCRIPTION_PLAN.PRO) return null;

	return <CustomerPortalButton>Manage Subscription</CustomerPortalButton>;
}
