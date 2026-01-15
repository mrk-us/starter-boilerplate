"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useCurrentUser } from "@/features/user/hooks";

// Paths exempt from setup check
const SETUP_EXEMPT_PATHS = [
	"/setup",
	"/sign-in",
	"/sign-up",
	"/sign-out",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/callback",
];

function isSetupExemptPath(pathname: string): boolean {
	return SETUP_EXEMPT_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
}

export function SetupGuard({ children }: { children: ReactNode }) {
	const { user, isLoading, isAuthenticated } = useCurrentUser();
	const pathname = usePathname();
	const router = useRouter();

	// Redirect to setup if authenticated but setup not completed
	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated) return;
		if (!user) return;
		if (isSetupExemptPath(pathname)) return;

		if (!user.setupCompleted) {
			router.replace("/setup");
		}
	}, [isLoading, isAuthenticated, user, pathname, router]);

	// Show nothing while loading or waiting for user record (OAuth race condition)
	if (isLoading) {
		return null;
	}

	// Not authenticated - render children (auth pages, etc.)
	if (!isAuthenticated) {
		return <>{children}</>;
	}

	// Redirect is happening - show nothing
	if (user && !user.setupCompleted && !isSetupExemptPath(pathname)) {
		return null;
	}

	return <>{children}</>;
}
