"use client";

import { useSignIn } from "@clerk/nextjs";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type VerifyResetCodeData = {
	code: string;
};

type ResetPasswordData = {
	password: string;
};

/**
 * Hook for verifying the reset code from the email
 */
export function useVerifyResetCode() {
	const { signIn, isLoaded } = useSignIn();

	if (!isLoaded || !signIn) throw new Error("Clerk is not loaded");

	const { mutateAsync, isPending, error, isSuccess } = useMutation({
		mutationFn: async (data: VerifyResetCodeData) => {
			// Use Clerk's sign-in method to verify the code
			const result = await signIn.attemptFirstFactor({
				strategy: "reset_password_email_code",
				code: data.code,
			});

			// Return success if the code is valid
			if (result.status === "needs_new_password") {
				return { success: true };
			}

			// Handle other statuses (e.g., invalid code)
			throw new Error("Invalid verification code");
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		verifyCode: mutateAsync,
		isPending: isPending || !isLoaded,
		isSuccess,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}

/**
 * Hook for setting the new password after code verification
 */
export function useResetPassword() {
	const router = useRouter();
	const { signIn, setActive, isLoaded } = useSignIn();

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (data: ResetPasswordData) => {
			if (!isLoaded || !signIn) throw new Error("Clerk is not loaded");
			// Use Clerk's sign-in method to set the new password
			const result = await signIn.resetPassword({
				password: data.password,
			});

			// Return success if the password is set
			if (result.status === "complete") {
				// Set the active session
				await setActive({ session: result.createdSessionId });
				// Return success
				return { success: true };
			}

			// Handle other statuses (e.g., invalid password)
			throw new Error("Password reset failed");
		},
		onSuccess: () => {
			// Redirect to sign-in page with success message
			router.push("/sign-in?reset=success");
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		resetPassword: mutateAsync,
		isPending: isPending || !isLoaded,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
