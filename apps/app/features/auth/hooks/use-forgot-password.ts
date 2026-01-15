"use client";

import { useSignIn } from "@clerk/nextjs";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type ForgotPasswordData = {
	email: string;
};

export function useForgotPassword() {
	const router = useRouter();
	const { signIn, isLoaded } = useSignIn();

	const { mutateAsync, isPending, error, isSuccess } = useMutation({
		mutationFn: async (data: ForgotPasswordData) => {
			if (!isLoaded || !signIn) throw new Error("Clerk is not loaded");
			// Use Clerk's sign-in method to initiate password reset
			await signIn.create({
				strategy: "reset_password_email_code",
				identifier: data.email,
			});

			// Return success
			return { success: true };
		},
		onSuccess: () => {
			// Redirect to reset password page
			router.push("/reset-password");
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		forgotPassword: mutateAsync,
		isPending: isPending || !isLoaded,
		isSuccess,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
