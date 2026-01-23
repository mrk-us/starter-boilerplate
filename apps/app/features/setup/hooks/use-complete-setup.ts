"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

export function useCompleteSetup() {
	const { user } = useUser();
	const completeSetupAction = useConvexAction(api.users.actions.completeSetup);

	const { mutateAsync, isPending, isError, error, isSuccess } = useMutation({
		mutationFn: async (name: string) => {
			// Call the Convex action which updates both Clerk and Convex DB
			await completeSetupAction({ name });

			// Reload Clerk user to refresh session claims
			// This ensures the middleware sees setupComplete = true
			if (user) {
				await user.reload();
			}

			return { success: true };
		},
		onError: (err) => {
			console.error("Complete setup error:", getErrorMessage(err));
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
