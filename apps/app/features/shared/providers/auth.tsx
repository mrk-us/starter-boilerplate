"use client";

import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useCurrentUser } from "@/features/user/hooks";

const SETUP_PATH = "/setup";
const AUTH_PATHS = [
	"/sign-in",
	"/sign-up",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
];

/*
 * AuthProvider
 * - Provides Convex auth boundary
 * - Redirects users who haven't completed setup to /setup
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const { isAuthenticated } = useConvexAuth();
	const { user, isLoading } = useCurrentUser();

	const isAuthPage = AUTH_PATHS.includes(pathname);
	const isSetupPage = pathname === SETUP_PATH;
	const needsSetup = isAuthenticated && user && !user.setupCompleted;

	// Setup redirect (authenticated users only)
	useEffect(() => {
		if (!isAuthenticated || isLoading || !user) return;

		if (needsSetup && !isSetupPage) {
			router.replace(SETUP_PATH);
		} else if (!needsSetup && isSetupPage) {
			router.replace("/");
		}
	}, [isAuthenticated, isLoading, user, needsSetup, isSetupPage, router]);

	// Auth pages render immediately
	if (isAuthPage) {
		return <>{children}</>;
	}

	// Wait for auth to resolve
	if (isLoading) {
		return null;
	}

	// Not authenticated - middleware redirects
	if (!isAuthenticated) {
		return null;
	}

	// Needs setup but not on setup page - block while redirecting
	if (needsSetup && !isSetupPage) {
		return null;
	}

	// Completed setup but on setup page - block while redirecting
	if (!needsSetup && isSetupPage && user) {
		return null;
	}

	return <>{children}</>;
}
