"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";

type UseCompleteSetupReturn = {
	completeSetup: (name: string) => Promise<{ success: boolean }>;
	isPending: boolean;
	isError: boolean;
	error: string | null;
	isSuccess: boolean;
};

export function useCompleteSetup(): UseCompleteSetupReturn {
	const convexMutation = useConvexMutation(api.users.mutations.completeSetup);

	const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
		mutationFn: (name: string) => convexMutation({ name }),
	});

	return {
		completeSetup: mutateAsync,
		isPending,
		isError,
		error: error instanceof Error ? error.message : null,
		isSuccess,
	};
}
