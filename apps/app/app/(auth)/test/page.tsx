import type { Metadata } from "next";
import { Example } from "@/features/shared/components";

export const metadata: Metadata = {
	title: "Test page",
	description: "Test page",
};

export default function TestPage() {
	return <Example title="Test page" />;
}
