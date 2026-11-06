import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createAccount } from "@/features/auth/server/account";

interface SignUpData {
  email: string;
  password: string;
}

export function useSignUp() {
  const navigate = useNavigate();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: SignUpData) =>
      createAccount({ data: { email: data.email, password: data.password } }),
    onSuccess: (res) => {
      if (res) {
        navigate({
          search: { authId: res.id, token: res.verifyToken },
          to: "/verify-email",
        });
      }
    },
  });

  return {
    error: error ? new Error(getErrorMessage(error)) : undefined,
    isPending,
    signUp: mutateAsync,
  };
}
