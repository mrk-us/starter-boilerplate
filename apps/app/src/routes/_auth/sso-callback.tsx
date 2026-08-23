import { AuthenticateWithRedirectCallback } from "@clerk/tanstack-react-start";
import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { SectionSpinner } from "@/features/shared/components";

export const Route = createFileRoute("/_auth/sso-callback")({
  component: SSOCallback,
  head: () => ({ meta: [{ title: `Signing you in | ${APP_NAME}` }] }),
});

/**
 * Landing page for an SSO redirect that did not produce a session
 *
 * Clerk completes the attempt here, turning an unrecognised OAuth account into
 * a sign-up before sending the browser on.
 */
function SSOCallback() {
  return (
    <>
      <SectionSpinner />
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
    </>
  );
}
