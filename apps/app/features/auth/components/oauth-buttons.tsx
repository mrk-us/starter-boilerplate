"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useTransition } from "react";

const REDIRECT_URI =
	process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
	"http://localhost:3001/callback";

export function OAuthButtons() {
	const [isPending, startTransition] = useTransition();
	const getOAuthUrl = useConvexAction(
		api.auth.actions.getOAuthAuthorizationUrl,
	);

	const handleOAuth = async (provider: "GoogleOAuth") => {
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
		<div className="flex flex-col gap-2">
			<Button
				type="button"
				className="w-full"
				disabled={isPending}
				onClick={() => handleOAuth("GoogleOAuth")}
			>
				<IconBrandGoogle className="size-4 fill-white/35 stroke-none" />
				Continue with Google
			</Button>
		</div>
	);
}
