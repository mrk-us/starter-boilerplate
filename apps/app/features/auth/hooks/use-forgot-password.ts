"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

type ForgotPasswordData = {
	email: string;
};

export function useForgotPassword() {
	const requestPasswordReset = useConvexAction(
		api.auth.actions.requestPasswordReset,
	);

	const { mutateAsync, isPending, error, isSuccess } = useMutation({
		mutationFn: (data: ForgotPasswordData) =>
			requestPasswordReset({ email: data.email }),
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	return {
		forgotPassword: mutateAsync,
		isPending,
		isSuccess,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
