"use client";

import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { signIn as signInAction } from "@/features/auth/server";

type SignInData = {
	email: string;
	password: string;
};

export function useSignIn() {
	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (data: SignInData) => signInAction(data),
		onSuccess: () => {
			window.location.href = "/";
		},
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	return {
		signIn: mutateAsync,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
