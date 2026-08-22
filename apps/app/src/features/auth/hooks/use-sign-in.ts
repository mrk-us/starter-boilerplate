import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { signIn as signInAction } from "@/features/auth/server/session";

interface SignInData {
  email: string;
  password: string;
}

export function useSignIn() {
  const { redirect } = useSearch({ from: "/_auth/sign-in" });

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: SignInData) => signInAction({ data }),
    onSuccess: () => {
      // A document navigation rather than a client-side one: the session cookie
      // was just set on the RPC response, and only a fresh request lets the
      // server pick it up when rendering the destination.
      window.location.href = redirect ?? "/";
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signIn: mutateAsync,
  };
}
