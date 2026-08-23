"use client";

import { useSignIn } from "@clerk/nextjs";
import type { OAuthStrategy } from "@repo/shared";
import { useAuthRedirect } from "./use-auth-redirect";

export function useOAuthSignIn() {
  const { signIn } = useSignIn();
  const { getDestination } = useAuthRedirect();

  /**
   * Starts a top-level redirect, so nothing after this runs on success.
   * Unknown accounts are converted into a sign-up on `/sso-callback`.
   */
  const signInWithOAuth = async (strategy: OAuthStrategy) => {
    const { error } = await signIn.sso({
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: getDestination(),
      strategy,
    });

    if (error) {
      throw error;
    }
  };

  return { signInWithOAuth };
}
