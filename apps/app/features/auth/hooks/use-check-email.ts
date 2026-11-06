"use client";

import { getOAuthSignInHint } from "@repo/backend/convex/auth/oauth";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { checkEmail as checkEmailAction } from "@/features/auth/server";

interface CheckEmailData {
  email: string;
}

interface CheckEmailSuccess {
  canProceed: true;
  hint?: string;
}

type CheckEmailResponse = CheckEmailSuccess;

export function useCheckEmail() {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (data: CheckEmailData): Promise<CheckEmailResponse> => {
      const result = await checkEmailAction(data.email);

      if ("error" in result) {
        throw new Error(result.error);
      }

      return {
        canProceed: true,
        hint: getOAuthSignInHint(result.oauthProviders),
      };
    },
  });

  return {
    checkEmail: mutateAsync,
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
  };
}
