"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";

type UseUpdateNameReturn = {
	updateName: (name: string) => Promise<{ success: boolean }>;
	isPending: boolean;
	isError: boolean;
	error: string | null;
	isSuccess: boolean;
};

export function useUpdateName(): UseUpdateNameReturn {
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
