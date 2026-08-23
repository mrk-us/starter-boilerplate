import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SectionSpinner } from "@/features/shared/components";
import { useCurrentUser } from "@/features/user/hooks";

export const Route = createFileRoute("/_authenticated/_setup-complete")({
  component: SetupCompleteLayout,
});

/**
 * A Clerk session carries no application metadata, so whether onboarding is
 * finished is only knowable from Convex. That puts this gate on the client,
 * after the user document has loaded, rather than in `beforeLoad`.
 */
function SetupCompleteLayout() {
  const { isAuthenticated, isLoading, user } = useCurrentUser();
  const navigate = useNavigate();
  // A failed auth bootstrap resolves to "not authenticated" rather than
  // "loading", which must not push an onboarded user onto the setup form.
  const needsSetup = !isLoading && isAuthenticated && !user?.setupComplete;

  useEffect(() => {
    if (needsSetup) {
      navigate({ replace: true, to: "/setup" });
    }
  }, [navigate, needsSetup]);

  if (isLoading || needsSetup) {
    return <SectionSpinner />;
  }

  return <Outlet />;
}
