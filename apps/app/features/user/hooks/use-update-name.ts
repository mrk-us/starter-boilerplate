"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";

export function useUpdateName() {
  const updateNameAction = useConvexAction(api.users.actions.updateName);

  const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
    mutationFn: (name: string) => updateNameAction({ name }),
  });

  return {
    error: error instanceof Error ? error.message : null,
    isError,
    isPending,
    isSuccess,
    updateName: mutateAsync,
  };
}
