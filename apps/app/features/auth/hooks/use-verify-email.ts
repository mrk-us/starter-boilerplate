"use client";

import { useSignUp } from "@clerk/nextjs";
import { useAuthRedirect } from "./use-auth-redirect";

/**
 * Second step of an email/password sign-up
 */
export function useVerifyEmail() {
  const { signUp } = useSignUp();
  const { navigate } = useAuthRedirect();

  const verifyEmail = async ({ code }: { code: string }) => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });

    if (error) {
      throw error;
    }

    if (signUp.status !== "complete") {
      throw new Error(`Sign-up requires an unsupported step: ${signUp.status}`);
    }

    await signUp.finalize({ navigate });
  };

  const resendCode = async () => {
    const { error } = await signUp.verifications.sendEmailCode();

    if (error) {
      throw error;
    }
  };

  return { resendCode, verifyEmail };
}
