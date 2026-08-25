import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

interface ResetPasswordData {
  password: string;
  token: string;
}

export function useResetPassword() {
  const navigate = useNavigate();

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
      navigate({ to: "/sign-in" });
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    resetPassword: mutateAsync,
  };
}
