"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { Button, FieldSeparator } from "@repo/ui/components";
import { useTransition } from "react";

const REDIRECT_URI =
	process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
	"http://localhost:3001/callback";

export function OAuthButtons() {
	const [isPending, startTransition] = useTransition();
	const getOAuthUrl = useConvexAction(
		api.auth.actions.getOAuthAuthorizationUrl,
	);

	const handleOAuth = async (provider: "GoogleOAuth" | "GitHubOAuth") => {
		startTransition(async () => {
			const result = await getOAuthUrl({
				provider,
				redirectUri: REDIRECT_URI,
			});

			if (result?.url) {
				window.location.href = result.url;
			}
		});
	};

	return (
		<>
			<FieldSeparator className="py-4">or</FieldSeparator>
			<div className="flex flex-col gap-2">
				<Button
					type="button"
					className="w-full"
					disabled={isPending}
					onClick={() => handleOAuth("GoogleOAuth")}
				>
					Continue with Google
				</Button>
				{/* <Button
					type="button"
					variant="outline"
					className="w-full"
					disabled={isPending}
					onClick={() => handleOAuth("GitHubOAuth")}
				>
					Continue with GitHub
				</Button> */}
			</div>
		</>
	);
}
