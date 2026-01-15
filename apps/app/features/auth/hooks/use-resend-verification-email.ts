"use client";

import { useSignUp } from "@clerk/nextjs";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

export function useResendVerificationEmail() {
	const { signUp, isLoaded } = useSignUp();

	const { mutateAsync, isPending, error, isSuccess } = useMutation({
		mutationFn: async () => {
			if (!isLoaded || !signUp) throw new Error("Clerk is not loaded");
			// Use Clerk's email verification method
			await signUp.prepareEmailAddressVerification({
				strategy: "email_code",
			});

			// Return success
			return { success: true };
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		resendVerificationEmail: mutateAsync,
		isPending: isPending || !isLoaded,
		isSuccess,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
