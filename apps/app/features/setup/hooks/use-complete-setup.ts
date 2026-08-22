"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function useCompleteSetup() {
	const router = useRouter();
	const convexAction = useConvexAction(api.users.actions.completeSetup);

	const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
		mutationFn: (name: string) => convexAction({ name }),
		onSuccess: () => {
			router.push("/");
		},
	});

	return {
		completeSetup: mutateAsync,
		isPending,
		isError,
		error: error instanceof Error ? error.message : null,
		isSuccess,
	};
}
