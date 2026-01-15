"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/types";
import { Button, FieldSeparator } from "@repo/ui/components";
import { useCallback, useTransition } from "react";

export function OAuthButtons() {
	const [isPending, startTransition] = useTransition();
	const { signIn, isLoaded: signInLoaded } = useSignIn();
	const { signUp, isLoaded: signUpLoaded } = useSignUp();

	const handleOAuth = useCallback(
		(strategy: OAuthStrategy) => {
			if (!signInLoaded || !signUpLoaded) return;

			startTransition(async () => {
				try {
					// Try to sign in with OAuth
					// If user doesn't exist, Clerk will automatically create an account
					await signIn.authenticateWithRedirect({
						strategy,
						redirectUrl: "/sign-in/sso-callback",
						redirectUrlComplete: "/",
					});
				} catch {
					// If sign-in fails, try sign-up
					await signUp.authenticateWithRedirect({
						strategy,
						redirectUrl: "/sign-up/sso-callback",
						redirectUrlComplete: "/",
					});
				}
			});
		},
		[signIn, signUp, signInLoaded, signUpLoaded],
	);

	const isLoading = isPending || !signInLoaded || !signUpLoaded;

	return (
		<>
			<FieldSeparator className="py-4">or</FieldSeparator>
			<div className="flex flex-col gap-2">
				<Button
					type="button"
					className="w-full"
					disabled={isLoading}
					onClick={() => handleOAuth("oauth_google")}
				>
					Continue with Google
				</Button>
				{/* <Button
					type="button"
					variant="outline"
					className="w-full"
					disabled={isLoading}
					onClick={() => handleOAuth("oauth_github")}
				>
					Continue with GitHub
				</Button> */}
			</div>
		</>
	);
}
