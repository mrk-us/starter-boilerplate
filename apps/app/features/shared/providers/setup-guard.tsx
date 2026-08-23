"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { SectionSpinner } from "@/features/shared/components";
import { useCurrentUser, useEnsureUser } from "@/features/user/hooks";
import { isPublicPath, isSetupPath } from "@/lib/routes";

/**
 * Client-side guard for setup redirect + loading state
 * Provisions the Convex user row, shows a full-page spinner while it resolves,
 * and keeps /setup and the rest of the app mutually exclusive: unfinished
 * onboarding goes to /setup, finished onboarding is sent back out of it
 */
export function SetupGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  useEnsureUser();

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

    // Onboarding already ran - a bookmark or the back button must not re-run it
    if (isSetupPage) {
      if (user?.setupComplete) {
        router.replace("/");
      }
      return;
    }

    // Redirect to setup if needed
    if (needsSetup) {
      router.replace("/setup");
    }
  }, [
    isLoading,
    isAuthenticated,
    needsSetup,
    router,
    isAuthPage,
    isSetupPage,
    user?.setupComplete,
  ]);

  // Show spinner while loading (except on auth pages)
  if (isLoading && !isAuthPage) {
    return <SectionSpinner />;
  }

  // Show spinner if authenticated but waiting for user data and not on setup/auth pages
  if (isAuthenticated && !user && !isAuthPage && !isSetupPage) {
    return <SectionSpinner />;
  }

  // Don't render onboarding for a user who has finished it while the redirect
  // above is in flight
  if (isSetupPage && user?.setupComplete) {
    return <SectionSpinner />;
  }

  return <>{children}</>;
}
