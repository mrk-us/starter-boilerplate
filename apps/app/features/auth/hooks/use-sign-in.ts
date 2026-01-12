"use client";

import { getErrorMessage } from "@repo/shared/utils";
import { useMutation } from "@tanstack/react-query";
import { signIn as signInAction } from "@/features/auth/server";

type SignInData = {
	email: string;
	password: string;
};

type UseSignInReturn = {
	signIn: (data: SignInData) => Promise<void>;
	isPending: boolean;
	error: Error | undefined;
};

export function useSignIn(): UseSignInReturn {
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
