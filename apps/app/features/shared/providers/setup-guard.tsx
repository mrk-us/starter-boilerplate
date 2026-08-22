"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { SectionSpinner } from "@/features/shared/components";
import { useCurrentUser } from "@/features/user/hooks";
import { isPublicPath, isSetupPath } from "@/lib/routes";

/**
 * Client-side guard for setup redirect + loading state
 * Shows full-page spinner while auth/user data loads
 * Redirects to /setup if onboarding not complete (or user not found yet)
 */
export function SetupGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = isPublicPath(pathname);
  const isSetupPage = isSetupPath(pathname);

  // Determine if setup is needed
  // - If user not found (null) but authenticated → new user, needs setup
  // - If user found but setupComplete is false → needs setup
  const needsSetup = isAuthenticated && !user?.setupComplete;

  useEffect(() => {
    // Wait for loading to complete
    if (isLoading) {
      return;
    }

    // Skip for auth pages
    if (isAuthPage) {
      return;
    }

    // Not signed in - nothing to do (proxy handles redirect)
    if (!isAuthenticated) {
      return;
    }

    // Already on setup page
    if (isSetupPage) {
      return;
    }

    // Redirect to setup if needed
    if (needsSetup) {
      router.replace("/setup");
    }
  }, [isLoading, isAuthenticated, needsSetup, router, isAuthPage, isSetupPage]);

  // Show spinner while loading (except on auth pages)
  if (isLoading && !isAuthPage) {
    return <SectionSpinner />;
  }

  // Show spinner if authenticated but waiting for user data and not on setup/auth pages
  if (isAuthenticated && !user && !isAuthPage && !isSetupPage) {
    return <SectionSpinner />;
  }

  return <>{children}</>;
}
