import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { SectionSpinner } from "@/features/shared/components";

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: `Signing you in | ${APP_NAME}`,
};

/**
 * Landing page for an SSO redirect that did not produce a session
 *
 * Clerk completes the attempt here, turning an unrecognised OAuth account into
 * a sign-up before sending the browser on.
 */
export default function SSOCallbackPage() {
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
