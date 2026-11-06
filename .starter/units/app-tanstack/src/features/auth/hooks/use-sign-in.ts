import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { getSignInDestination } from "@/features/auth/return-path";
import { signIn as signInAction } from "@/features/auth/server/session";

interface SignInData {
  email: string;
  password: string;
}

export function useSignIn() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/_auth/sign-in" });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: SignInData) => signInAction({ data }),
    onSuccess: ({ verifyAuthId }) => {
      if (verifyAuthId) {
        navigate({ search: { authId: verifyAuthId }, to: "/verify-email" });
        return;
      }

      // A document navigation rather than a client-side one: the session cookie
      // was just set on the RPC response, and only a fresh request lets the
      // server pick it up when rendering the destination.
      window.location.href = getSignInDestination(
        redirect,
        window.location.hash
      );
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signIn: mutateAsync,
  };
}
