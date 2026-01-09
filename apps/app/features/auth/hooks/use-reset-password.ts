"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/features/shared/utils";

type ResetPasswordData = {
	token: string;
	password: string;
};

type ResetPasswordResult = {
	success: boolean;
};

type UseResetPasswordReturn = {
	resetPassword: (data: ResetPasswordData) => Promise<ResetPasswordResult>;
	isPending: boolean;
	error: Error | undefined;
};

export function useResetPassword(): UseResetPasswordReturn {
	const router = useRouter();

	const resetPasswordWithToken = useConvexAction(
		api.auth.actions.resetPasswordWithToken,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (data: ResetPasswordData): Promise<ResetPasswordResult> =>
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

	const resetPassword = async (data: ResetPasswordData) => {
		return mutateAsync(data);
	};

	return {
		resetPassword,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
