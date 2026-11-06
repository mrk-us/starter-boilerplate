"use client";

import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createAccount } from "@/features/auth/server";

interface SignUpData {
  email: string;
  password: string;
}

export function useSignUp() {
  const router = useRouter();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: SignUpData) => {
      const result = await createAccount(data);

      if ("error" in result) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (res) => {
      router.push(`/verify-email?authId=${res.id}&token=${res.verifyToken}`);
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signUp: mutateAsync,
  };
}
