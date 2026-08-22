"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface SignUpWithPasswordInput {
  email: string;
  password: string;
}

export function useSignUpWithPassword() {
  const { signUp } = useSignUp();
  const router = useRouter();

  const signUpWithPassword = async ({
    email,
    password,
  }: SignUpWithPasswordInput) => {
    const { error } = await signUp.password({
      emailAddress: email,
      password,
    });

    if (error) {
      throw error;
    }

    const { error: sendCodeError } = await signUp.verifications.sendEmailCode();

    if (sendCodeError) {
      throw sendCodeError;
    }

    router.push("/verify-email");
  };

  return { signUpWithPassword };
}
