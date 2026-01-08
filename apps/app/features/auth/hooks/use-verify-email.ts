"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/features/shared/utils/errors";

type VerifyEmailData = {
	authId: string;
	code: string;
};

type VerifyEmailResult = {
	success: boolean;
};

export function useVerifyEmail() {
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
