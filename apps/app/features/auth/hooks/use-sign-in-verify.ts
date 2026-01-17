"use client";

import { useSignIn } from "@clerk/nextjs";
import { signInSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

const signInVerifySchema = z.object({
	code: signInSchema.shape.code,
});

type SignInVerifyData = z.infer<typeof signInVerifySchema>;

export function useSignInVerify() {
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect") || "/";

	const { signIn, setActive, isLoaded } = useSignIn();

	const { mutateAsync: verify } = useMutation({
		mutationFn: async (data: SignInVerifyData) => {
			// Return if Clerk is not loaded
			if (!isLoaded) throw new Error("Clerk is not loaded");
			// Return if no sign-in attempt is found
			if (!signIn) throw new Error("No sign-in attempt found");

			// Attempt second factor verification with the email code
			const result = await signIn.attemptSecondFactor({
				strategy: "email_code",
				code: data.code,
			});

			// If verification is complete, set the active session
			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				// Return success
				return { success: true };
			}

			// If verification fails, throw an error
			throw new Error(`Verification failed: ${result.status}`);
		},
		onSuccess: () => {
			// Full page reload to ensure session is properly set
			window.location.href = redirect;
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	// Resend the verification code
	const {
		mutateAsync: resendCode,
		isPending: isResending,
		isSuccess: resendSuccess,
	} = useMutation({
		mutationFn: async () => {
			// Return if Clerk is not loaded
			if (!isLoaded) throw new Error("Clerk is not loaded");
			// Return if no sign-in attempt is found
			if (!signIn) throw new Error("No sign-in attempt found");

			// Prepare second factor verification with email code
			await signIn.prepareSecondFactor({
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
		verify,
		email: signIn?.identifier,
		resendCode,
		isResending,
		resendSuccess,
	};
}
