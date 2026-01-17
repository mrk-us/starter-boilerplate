"use client";

import { useSignIn } from "@clerk/nextjs";
import { signInSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";

const signInPasswordSchema = z.object({
	password: signInSchema.shape.password,
});

type SignInPasswordData = z.infer<typeof signInPasswordSchema>;

export function useSignInPassword() {
	const router = useRouter();
	const { signIn, setActive, isLoaded } = useSignIn();

	const { mutateAsync: signInWithPassword } = useMutation({
		mutationFn: async (data: SignInPasswordData) => {
			// Return if Clerk is not loaded
			if (!isLoaded) throw new Error("Clerk is not loaded");
			// Return if no sign-in attempt is found
			if (!signIn) throw new Error("No sign-in attempt found");

			// Attempt first factor authentication with password
			const result = await signIn.attemptFirstFactor({
				strategy: "password",
				password: data.password,
			});

			// If authentication is complete, set the active session
			if (result.status === "complete") {
				await setActive({ session: result.createdSessionId });
				// Return success and that no second factor is needed
				return { success: true, needsSecondFactor: false };
			}

			// If second factor is needed, check if email code is supported
			if (result.status === "needs_second_factor") {
				// Send email with code
				await signIn.prepareSecondFactor({
					strategy: "email_code",
				});
				// Return success and that a second factor is needed
				return { success: true, needsSecondFactor: true };
			}

			// If authentication fails, throw an error
			throw new Error(`Sign-in failed: ${result.status}`);
		},
		onSuccess: (result) => {
			if (result.needsSecondFactor) {
				// Navigate to verification step
				router.push("/sign-in/verify");
				return;
			}

			// Full page reload to ensure session is properly set
			window.location.href = "/";
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		signInWithPassword,
		email: signIn?.identifier,
	};
}
