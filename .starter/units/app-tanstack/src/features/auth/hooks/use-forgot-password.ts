import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { requestPasswordReset } from "@/features/auth/server/account";

interface ForgotPasswordData {
  email: string;
}

export function useForgotPassword() {
  const { mutateAsync, isPending, error, isSuccess } = useMutation({
    mutationFn: (data: ForgotPasswordData) =>
      requestPasswordReset({ data: { email: data.email } }),
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    forgotPassword: mutateAsync,
    isPending,
    isSuccess,
  };
}
