import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import {
  getErrorMessage,
  getOAuthProvidersMessage,
  tryCatch,
} from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

interface CheckEmailData {
  email: string;
}

interface CheckEmailSuccess {
  canProceed: true;
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

      // Check for OAuth providers - throw as error so form.Errors displays it
      if (checkEmailExistsData.oauthProviders.length > 0) {
        // Clerk supports far more providers than this app offers buttons for,
        // so an unrecognised one still has to say something useful.
        throw new Error(
          getOAuthProvidersMessage(checkEmailExistsData.oauthProviders) ??
            "You previously signed in with a social account."
        );
      }

      return { canProceed: true };
    },
  });

  return {
    checkEmail: mutateAsync,
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
  };
}
