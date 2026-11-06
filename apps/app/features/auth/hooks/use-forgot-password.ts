"use client";

import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "@/features/auth/server";

interface ForgotPasswordData {
  email: string;
}

export function useForgotPassword() {
  const { mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const result = await requestPasswordReset(data.email);

      if ("error" in result) {
        throw new Error(result.error);
      }

      return result;
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    forgotPassword: mutateAsync,
    isPending,
    isSuccess,
  };
}
