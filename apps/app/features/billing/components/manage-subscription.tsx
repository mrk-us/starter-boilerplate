"use client";

import { useSubscription } from "@/features/billing/hooks";
import { CustomerPortalButton } from "./customer-portal-button";

export function ManageSubscription() {
  const { status, isLoading } = useSubscription();

  if (isLoading || !status) {
    return null;
  }

  return <CustomerPortalButton>Manage Subscription</CustomerPortalButton>;
}
