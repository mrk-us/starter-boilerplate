"use client";

import { useSignIn as useClerkSignIn } from "@clerk/nextjs";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

type SignInData = {
	email: string;
	password: string;
};

export function useSignIn() {
	// Get the redirect from the search params
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect") || "/";

	const { signIn, setActive, isLoaded } = useClerkSignIn();

	const { mutateAsync, isPending, error } = useMutation({
		mutationFn: async (data: SignInData) => {
			// Return if Clerk is not loaded
			if (!isLoaded || !signIn) throw new Error("Clerk is not loaded");
			// Use Clerk's sign-in method
			const res = await signIn.create({
				identifier: data.email,
				password: data.password,
			});

			if (res.status === "complete") {
				// Set the active session
				await setActive({ session: res.createdSessionId });
				// Return success
				return { success: true };
			}

			// Handle other statuses (e.g., needs_second_factor)
			throw new Error("Sign-in requires additional verification");
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

	return {
		signIn: mutateAsync,
		isPending: isPending || !isLoaded,
		error: error ? new Error(getErrorMessage(error)) : undefined,
	};
}
