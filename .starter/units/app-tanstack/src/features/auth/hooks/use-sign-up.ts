import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

interface SignUpData {
  email: string;
  password: string;
}

export function useSignUp() {
  const navigate = useNavigate();

  const createUserAccount = useConvexAction(api.auth.actions.createUserAccount);

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: SignUpData) =>
      createUserAccount({ email: data.email, password: data.password }),
    onSuccess: (res) => {
      if (res) {
        navigate({ search: { authId: res.id }, to: "/verify-email" });
      }
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signUp: mutateAsync,
  };
}
