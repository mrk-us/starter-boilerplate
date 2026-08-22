"use client";

import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { signIn as signInAction } from "@/features/auth/server";

interface SignInData {
  email: string;
  password: string;
}

export function useSignIn() {
  const searchParams = useSearchParams();
  // Redirect to the original URL after sign in
  const redirect = searchParams.get("redirect") || "/";

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: SignInData) => signInAction(data),
    onSuccess: () => {
      window.location.href = redirect;
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signIn: mutateAsync,
  };
}
