"use client";

import { useAuth } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

/**
 * Client-side fallback for setup redirect
 * Primary enforcement is done by middleware via session claims
 * This handles edge cases like client-side navigation
 */
export function SetupGuard({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useConvexAuth();
	const { isLoaded, sessionClaims } = useAuth();
	const pathname = usePathname();
	const router = useRouter();

	useEffect(() => {
		// Wait for auth to load
		if (!isLoaded) return;

		// Not signed in - nothing to do
		if (!isAuthenticated) return;

		// Already on setup page
		if (pathname === "/setup" || pathname.startsWith("/setup/")) return;

		// Check if onboarding is complete via session claims
		const setupComplete = sessionClaims?.metadata?.setupComplete;

		// Redirect to setup if not complete
		if (!setupComplete) {
			router.replace("/setup");
		}
	}, [isLoaded, isAuthenticated, sessionClaims, pathname, router]);

	return <>{children}</>;
}
