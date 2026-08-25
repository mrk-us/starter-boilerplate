import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

interface VerifyEmailData {
  authId: string;
  code: string;
}

export function useVerifyEmail() {
  const navigate = useNavigate();

  const verifyUserEmail = useConvexAction(api.auth.actions.verifyEmail);

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: VerifyEmailData) =>
      verifyUserEmail({ authId: data.authId, code: data.code }),
    onSuccess: (res) => {
      if (res.success) {
        navigate({ to: "/" });
      }
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    verifyEmail: mutateAsync,
  };
}
