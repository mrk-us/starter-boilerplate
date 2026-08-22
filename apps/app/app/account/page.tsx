import type { Metadata } from "next";
import { AccountForm } from "@/features/shared/components";

export const metadata: Metadata = {
  description: "Account settings",
  title: "Account",
};

export default function Account() {
  return <AccountForm />;
}
