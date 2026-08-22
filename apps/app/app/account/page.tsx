import type { Metadata } from "next";
import { AccountForm } from "@/features/shared/components";

export const metadata: Metadata = {
	title: "Account",
	description: "Account settings",
};

export default function Account() {
	return <AccountForm />;
}
