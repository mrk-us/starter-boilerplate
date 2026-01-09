"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/features/shared/utils";

type SignUpData = {
	email: string;
	password: string;
};

type SignUpResult = {
	id: string;
	emailVerified: boolean;
};

export function useSignUp() {
	const router = useRouter();

	const createUserAccount = useConvexAction(api.auth.actions.createUserAccount);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (data: SignUpData): Promise<SignUpResult> =>
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

	const signUp = async (data: SignUpData) => {
		return mutateAsync(data);
	};

	return {
		signUp,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
