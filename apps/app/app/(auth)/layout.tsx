import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AuthLayout({
	children,
}: {
	children: ReactNode;
}) {
	// Redirect authenticated users away from auth pages
	const { user } = await withAuth();

	if (user) {
		redirect("/");
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface">
			<div className="w-full max-w-sm">{children}</div>
		</div>
	);
}
