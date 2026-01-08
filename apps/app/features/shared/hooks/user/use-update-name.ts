"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";

export function useUpdateName() {
	const convexMutation = useConvexMutation(api.users.mutations.updateName);

	const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
		mutationFn: (name: string) => convexMutation({ name }),
	});

	return {
		updateName: mutateAsync,
		isPending,
		isError,
		error: error instanceof Error ? error.message : null,
		isSuccess,
	};
}
