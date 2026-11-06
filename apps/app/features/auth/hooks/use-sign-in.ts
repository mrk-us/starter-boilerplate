"use client";

import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getReturnPath,
  getSignInDestination,
} from "@/features/auth/return-path";
import { signIn as signInAction } from "@/features/auth/server";

interface SignInData {
  email: string;
  password: string;
}

export function useSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Redirect to the original URL after sign in
  const redirect = getReturnPath(searchParams.get("redirect"));

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: SignInData) => {
      const result = await signInAction(data);

      if ("error" in result) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (result) => {
      if ("verifyAuthId" in result) {
        router.push(`/verify-email?authId=${result.verifyAuthId}`);
        return;
      }

      window.location.href = getSignInDestination(
        redirect,
        window.location.hash
      );
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signIn: mutateAsync,
  };
}
