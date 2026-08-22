import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";

export function useDeleteAccount() {
  const { signOut } = useAuth();

  const deleteUser = useConvexAction(api.users.actions.deleteUser);

  const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async () => {
      await deleteUser();
      // signOut ends the WorkOS session and navigates the document, so it also
      // stands in for the post-delete redirect.
      await signOut({ returnTo: "/sign-in" });
    },
    onError: (mutationError) => {
      console.error(getErrorMessage(mutationError));
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
