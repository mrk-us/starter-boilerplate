"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/utils";

type ForgotPasswordData = {
	email: string;
};

type ForgotPasswordResult = {
	success: boolean;
};

export function useForgotPassword() {
	const requestPasswordReset = useConvexAction(
		api.auth.actions.requestPasswordReset,
	);

	const { mutateAsync, isPending, error, isSuccess } = useMutation({
		mutationFn: (data: ForgotPasswordData): Promise<ForgotPasswordResult> =>
			requestPasswordReset({ email: data.email }),
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	const forgotPassword = async (data: ForgotPasswordData) => {
		return mutateAsync(data);
	};

	return {
		forgotPassword,
		isPending,
		isSuccess,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
