"use client";

import { useSignIn } from "@clerk/nextjs";
import { signInSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage } from "@repo/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { OAUTH_PROVIDERS } from "@/features/auth/lib/oauth-providers";

const signInEmailSchema = z.object({
	email: signInSchema.shape.email,
});

type SignInEmailData = z.infer<typeof signInEmailSchema>;

export function useSignInEmail() {
	const router = useRouter();
	const { signIn, isLoaded } = useSignIn();

	const { mutateAsync: validateEmail } = useMutation({
		mutationFn: async (data: SignInEmailData) => {
			// Return if Clerk is not loaded
			if (!isLoaded) throw new Error("Clerk is not loaded");
			// Return if no sign-in attempt is found
			if (!signIn) throw new Error("No sign-in attempt found");

			// Create sign-in attempt with just the identifier
			// This validates the email exists and sets up the sign-in state
			const result = await signIn.create({
				identifier: data.email,
			});

			// If user exists, Clerk returns needs_first_factor status
			if (result.status === "needs_first_factor") {
				// Check what first factors are supported
				const supportedStrategies =
					result.supportedFirstFactors?.map((f) => f.strategy) ?? [];

				// Check if user has password
				const hasPassword = supportedStrategies.includes("password");
				// Check if user has OAuth
				const hasOAuth = supportedStrategies.some((s) =>
					s.startsWith("oauth_"),
				);
				// Check if user has specific OAuth providers
				const matchedProvider = OAUTH_PROVIDERS.find((provider) =>
					supportedStrategies.includes(provider.strategy),
				);

				// If user only has OAuth (no password), they need to use OAuth button
				if (!hasPassword && hasOAuth && matchedProvider) {
					throw new Error(matchedProvider.message);
				}

				return { success: true };
			}

			// If email doesn't exist, throw an error
			throw new Error("Email not found");
		},
		onSuccess: () => {
			// Navigate to password step
			router.push("/sign-in/password");
		},
		onError: (err) => {
			// Log errors
			console.error(getErrorMessage(err));
		},
	});

	return {
		validateEmail,
	};
}
