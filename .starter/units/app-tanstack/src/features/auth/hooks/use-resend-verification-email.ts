import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

interface ResendVerificationEmailData {
  authId: string;
}

export function useResendVerificationEmail() {
  const resendUserVerificationEmail = useConvexAction(
    api.auth.actions.resendVerificationEmail
  );

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: ResendVerificationEmailData) =>
      resendUserVerificationEmail({ authId: data.authId }),
    onSuccess: (res) => {
      if (res.success) {
        // TODO: Show success message
      }
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    resendVerificationEmail: mutateAsync,
  };
}
