"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type ResetPasswordData = {
	token: string;
	password: string;
};

export function useResetPassword() {
	const router = useRouter();

	const resetPasswordWithToken = useConvexAction(
		api.auth.actions.resetPasswordWithToken,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (data: ResetPasswordData) =>
			resetPasswordWithToken({
				token: data.token,
				newPassword: data.password,
			}),
		onSuccess: () => {
			router.push("/sign-in?reset=success");
		},
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	return {
		resetPassword: mutateAsync,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
