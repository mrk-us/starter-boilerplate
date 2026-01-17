"use client";

import { useSignIn, useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/types";
import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
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
						redirectUrl: "/sso-callback",
						redirectUrlComplete: "/",
					});
				} catch {
					// If sign-in fails, try sign-up
					await signUp.authenticateWithRedirect({
						strategy,
						redirectUrl: "/sso-callback",
						redirectUrlComplete: "/",
					});
				}
			});
		},
		[signIn, signUp, signInLoaded, signUpLoaded],
	);

	const isLoading = isPending || !signInLoaded || !signUpLoaded;

	return (
		<div className="flex flex-col gap-2">
			<Button
				type="button"
				className="w-full gap-2"
				disabled={isLoading}
				onClick={() => handleOAuth("oauth_google")}
			>
				<IconBrandGoogle className="size-4 fill-white/35 stroke-none" />
				Continue with Google
			</Button>
		</div>
	);
}
