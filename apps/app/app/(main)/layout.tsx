import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function MainLayout({
	children,
}: {
	children: ReactNode;
}) {
	// Server-side auth check for protected routes
	const { user } = await withAuth();

	// Redundancy, middleware should catch this
	if (!user) {
		redirect("/sign-in");
	}

	return <>{children}</>;
}
