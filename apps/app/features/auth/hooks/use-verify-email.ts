"use client";

import { useSignUp } from "@clerk/nextjs";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";

type VerifyEmailData = {
	code: string;
};

export function useVerifyEmail() {
	const { signUp, setActive, isLoaded } = useSignUp();

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (data: VerifyEmailData) => {
			if (!isLoaded || !signUp) throw new Error("Clerk is not loaded");
			// Use Clerk's verify email method
			const result = await signUp.attemptEmailAddressVerification({
				code: data.code,
			});

			if (result.status === "complete") {
				// Set the active session
				await setActive({ session: result.createdSessionId });
				// Return success
				return { success: true };
			}

			// Handle other statuses (e.g., expired)
			throw new Error("Verification failed");
		},
		onSuccess: () => {
			// Full page reload to ensure session is properly set
			window.location.href = "/";
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		verifyEmail: mutateAsync,
		isPending: isPending || !isLoaded,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
