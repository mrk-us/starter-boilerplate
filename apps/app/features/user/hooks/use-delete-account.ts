"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";

export function useDeleteAccount() {
  const router = useRouter();
  const { signOut } = useAuth();

  const deleteUser = useConvexAction(api.users.actions.deleteUser);

  const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async () => {
      await deleteUser();
      await signOut();
    },
    onError: (mutationError) => {
      console.error(getErrorMessage(mutationError));
    },
    onSuccess: () => {
      router.push("/sign-in");
    },
  });

  return {
    deleteAccount: mutateAsync,
    error: error instanceof Error ? error.message : null,
    isError,
    isPending,
    isSuccess,
  };
}
