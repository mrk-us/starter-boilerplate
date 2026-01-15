"use client";

import { useSignUp as useClerkSignUp } from "@clerk/nextjs";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

type SignUpData = {
	email: string;
	password: string;
};

export function useSignUp() {
	const router = useRouter();
	const { signUp, isLoaded } = useClerkSignUp();

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (data: SignUpData) => {
			// Return if Clerk is not loaded
			if (!isLoaded || !signUp) throw new Error("Clerk is not loaded");
			// Use Clerk's sign-up method
			await signUp.create({
				emailAddress: data.email,
				password: data.password,
			});

			// Send verification email
			await signUp.prepareEmailAddressVerification({
				strategy: "email_code",
			});

			// Return success
			return { success: true };
		},
		onSuccess: () => {
			// Redirect to verify email page
			router.push("/verify-email");
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		signUp: mutateAsync,
		isPending: isPending || !isLoaded,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
