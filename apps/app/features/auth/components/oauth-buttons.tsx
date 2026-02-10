"use client";

import { useConvexAction } from "@convex-dev/react-query";
import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useTransition } from "react";
import { isElectron } from "@/utils";

const WEB_REDIRECT_URI =
	process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI ||
	"http://localhost:3001/callback";
const ELECTRON_REDIRECT_URI =
	process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI_ELECTRON;

export function OAuthButtons() {
	const [isPending, startTransition] = useTransition();
	const getOAuthUrl = useConvexAction(
		api.auth.actions.getOAuthAuthorizationUrl,
	);

	const handleOAuth = async (provider: "GoogleOAuth") => {
		startTransition(async () => {
			const isElectronRuntime = isElectron();
			const redirectUri =
				isElectronRuntime && ELECTRON_REDIRECT_URI
					? ELECTRON_REDIRECT_URI
					: WEB_REDIRECT_URI;
			const result = await getOAuthUrl({
				provider,
				redirectUri,
			});

			if (result?.url) {
				if (isElectronRuntime) {
					const openExternal = window.electron?.openExternal;
					if (typeof openExternal === "function") {
						try {
							await openExternal(result.url);
							return;
						} catch {
							// Fall back to in-app window if the bridge fails.
						}
					}
				}

				window.open(result.url, "_blank", "noopener,noreferrer");
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
