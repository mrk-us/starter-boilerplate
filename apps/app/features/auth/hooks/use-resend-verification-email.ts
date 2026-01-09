"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/utils";

type ResendVerificationEmailData = {
	authId: string;
};

type ResendVerificationEmailResult = {
	success: boolean;
};

type UseResendVerificationEmailReturn = {
	resendVerificationEmail: (
		data: ResendVerificationEmailData,
	) => Promise<ResendVerificationEmailResult>;
	isPending: boolean;
	error: Error | undefined;
};

export function useResendVerificationEmail(): UseResendVerificationEmailReturn {
	const resendUserVerificationEmail = useConvexAction(
		api.auth.actions.resendVerificationEmail,
	);

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: (
			data: ResendVerificationEmailData,
		): Promise<ResendVerificationEmailResult> =>
			resendUserVerificationEmail({ authId: data.authId }),
		onSuccess: (res) => {
			if (res.success) {
				// TODO: Show success message
			}
		},
		onError: (err) => {
			console.error(getErrorMessage(err));
		},
	});

	const resendVerificationEmail = async (data: ResendVerificationEmailData) => {
		return mutateAsync(data);
	};

	return {
		resendVerificationEmail,
		isPending,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
