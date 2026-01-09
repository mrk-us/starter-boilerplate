import type { Metadata } from "next";
import { BillingPage } from "@/features/billing/components";

export const metadata: Metadata = {
	title: "Billing",
	description: "Manage your subscription and billing",
};

export default function Billing() {
	return <BillingPage />;
}
