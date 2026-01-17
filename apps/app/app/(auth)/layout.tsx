import type { ReactNode } from "react";

export default async function AuthLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="flex flex-row items-center size-screen bg-surface *:w-full *:flex-1 p-5 h-svh">
			<div className="">{children}</div>

			<div className="bg-page self-stretch hidden lg:block rounded-3xl corner-superellipse/1.2 shadow-glass-secondary-elevated"></div>
		</div>
	);
}
