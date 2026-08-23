import { useClerk } from "@clerk/tanstack-react-start";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

export function useDeleteAccount() {
  const { signOut } = useClerk();

  const deleteUser = useConvexAction(api.users.actions.deleteUser);

  const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: async () => {
      // The action deletes the Clerk user too, so the local session has to go
      // before anything else tries to use it.
      await deleteUser();
      await signOut({ redirectUrl: "/sign-in" });
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
