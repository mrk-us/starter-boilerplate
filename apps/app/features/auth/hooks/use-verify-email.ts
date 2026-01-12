"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { getErrorMessage } from "@repo/shared/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type VerifyEmailData = {
	authId: string;
	code: string;
};

type VerifyEmailResult = {
	success: boolean;
};

type UseVerifyEmailReturn = {
	verifyEmail: (data: VerifyEmailData) => Promise<VerifyEmailResult>;
	isPending: boolean;
	error: Error | undefined;
};

export function useVerifyEmail(): UseVerifyEmailReturn {
	const router = useRouter();

	const verifyUserEmail = useConvexAction(api.auth.actions.verifyEmail);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (data: VerifyEmailData): Promise<VerifyEmailResult> =>
			verifyUserEmail({ authId: data.authId, code: data.code }),
		onSuccess: (res) => {
			if (res.success) {
				router.push(`/`);
			}
		},
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	const verifyEmail = async (data: VerifyEmailData) => {
		return mutateAsync(data);
	};

	return {
		verifyEmail,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
