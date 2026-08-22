"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

interface ResetPasswordData {
  password: string;
  token: string;
}

export function useResetPassword() {
  const router = useRouter();

  const resetPasswordWithToken = useConvexAction(
    api.auth.actions.resetPasswordWithToken
  );

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: ResetPasswordData) =>
      resetPasswordWithToken({
        newPassword: data.password,
        token: data.token,
      }),
    onSuccess: () => {
      router.push("/sign-in?reset=success");
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    resetPassword: mutateAsync,
  };
}
