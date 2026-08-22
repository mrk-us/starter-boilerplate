"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function useForgotPassword() {
  const { signIn } = useSignIn();
  const router = useRouter();

  const forgotPassword = async ({ email }: { email: string }) => {
    const { error } = await signIn.create({ identifier: email });

    if (error) {
      throw error;
    }

    const { error: sendCodeError } =
      await signIn.resetPasswordEmailCode.sendCode();

    if (sendCodeError) {
      throw sendCodeError;
    }

    // The sign-in attempt lives on the Clerk client, so /reset-password picks
    // up where this left off.
    router.push("/reset-password");
  };

  return { forgotPassword };
}
