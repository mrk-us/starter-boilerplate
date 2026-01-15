import type { ReactNode } from "react";

export default async function AuthLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface">
			<div className="w-full max-w-xs">{children}</div>
		</div>
	);
}
