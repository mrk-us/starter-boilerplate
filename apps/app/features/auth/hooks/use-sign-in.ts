"use client";

import { useMutation } from "@tanstack/react-query";
import { signIn as signInAction } from "@/features/auth/server";
import { getErrorMessage } from "@/features/shared/utils";

type SignInData = {
	email: string;
	password: string;
};

export function useSignIn() {
	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (data: SignInData) => {
			// Authenticate and save session via server action
			return signInAction(data);
		},
		onSuccess: () => {
			window.location.href = "/";
		},
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	const signIn = async (data: SignInData) => {
		return mutateAsync(data);
	};

	return {
		signIn,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
