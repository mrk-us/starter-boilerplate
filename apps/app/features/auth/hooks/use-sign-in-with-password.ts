"use client";

import { useSignIn } from "@clerk/nextjs";
import { useAuthRedirect } from "./use-auth-redirect";

interface SignInWithPasswordInput {
  email: string;
  password: string;
}

export function useSignInWithPassword() {
  const { signIn } = useSignIn();
  const { navigate } = useAuthRedirect();

  /**
   * Resolves to `true` when Clerk wants an emailed code before it trusts this
   * device, which is its default for a new browser.
   */
  const signInWithPassword = async ({
    email,
    password,
  }: SignInWithPasswordInput): Promise<boolean> => {
    const { error } = await signIn.password({
      emailAddress: email,
      password,
    });

    if (error) {
      throw error;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({ navigate });
      return false;
    }

    if (signIn.status === "needs_client_trust") {
      const { error: sendCodeError } = await signIn.mfa.sendEmailCode();

      if (sendCodeError) {
        throw sendCodeError;
      }

      return true;
    }

    throw new Error(`Sign-in requires an unsupported step: ${signIn.status}`);
  };

  return { signInWithPassword };
}
