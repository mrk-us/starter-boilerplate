"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type SignUpData = {
	email: string;
	password: string;
};

export function useSignUp() {
	const router = useRouter();

	const createUserAccount = useConvexAction(api.auth.actions.createUserAccount);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (data: SignUpData) =>
			createUserAccount({ email: data.email, password: data.password }),
		onSuccess: (res) => {
			if (res) {
				router.push(`/verify-email?authId=${res.id}`);
			}
		},
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	return {
		signUp: mutateAsync,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
