"use client";

import { useSignUp } from "@clerk/nextjs";
import type { OAuthStrategy } from "@clerk/types";
import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useCallback, useTransition } from "react";

export function OAuthButtons() {
	const [isPending, startTransition] = useTransition();
	const { signUp, isLoaded } = useSignUp();

	const handleOAuth = useCallback(
		(strategy: OAuthStrategy) => {
			if (!isLoaded || !signUp) return;

			startTransition(async () => {
				// Use signUp for OAuth - it handles both new and existing users
				// via Clerk's account linking when the email already exists
				await signUp.authenticateWithRedirect({
					strategy,
					redirectUrl: "/sso-callback",
					redirectUrlComplete: "/",
				});
			});
		},
		[signUp, isLoaded],
	);

	const isLoading = isPending || !isLoaded;

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
