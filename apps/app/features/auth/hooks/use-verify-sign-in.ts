"use client";

import { useSignIn } from "@clerk/nextjs";
import { useAuthRedirect } from "./use-auth-redirect";

/**
 * Second step of a password sign-in from an untrusted device
 */
export function useVerifySignIn() {
  const { signIn } = useSignIn();
  const { navigate } = useAuthRedirect();

  const verifySignIn = async ({ code }: { code: string }) => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });

    if (error) {
      throw error;
    }

    if (signIn.status !== "complete") {
      throw new Error(`Sign-in requires an unsupported step: ${signIn.status}`);
    }

    await signIn.finalize({ navigate });
  };

  const resendCode = async () => {
    const { error } = await signIn.mfa.sendEmailCode();

    if (error) {
      throw error;
    }
  };

  return { resendCode, verifySignIn };
}
