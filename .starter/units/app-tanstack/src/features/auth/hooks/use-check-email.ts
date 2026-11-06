import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getOAuthSignInHint } from "@repo/backend/convex/auth/oauth";
import { getErrorMessage, tryCatch } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

interface CheckEmailData {
  email: string;
}

interface CheckEmailSuccess {
  canProceed: true;
  hint?: string;
}

type CheckEmailResponse = CheckEmailSuccess;

export function useCheckEmail() {
  const checkEmailExistsAction = useConvexAction(
    api.auth.actions.checkEmailExists
  );

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: CheckEmailData): Promise<CheckEmailResponse> => {
      const { data: checkEmailExistsData, error: checkEmailExistsError } =
        await tryCatch(checkEmailExistsAction({ email: data.email }));

      if (checkEmailExistsError) {
        throw new Error(checkEmailExistsError.message);
      }

      return {
        canProceed: true,
        hint: getOAuthSignInHint(checkEmailExistsData.oauthProviders),
      };
    },
  });

  return {
    checkEmail: mutateAsync,
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
  };
}
