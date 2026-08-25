import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function useCompleteSetup() {
  const navigate = useNavigate();
  const convexAction = useConvexAction(api.users.actions.completeSetup);

  const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: (name: string) => convexAction({ name }),
    onSuccess: () => {
      navigate({ to: "/" });
    },
  });

  return {
    completeSetup: mutateAsync,
    error: error instanceof Error ? error.message : null,
    isError,
    isPending,
    isSuccess,
  };
}
