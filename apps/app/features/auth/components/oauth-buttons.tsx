"use client";

import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useTransition } from "react";
import { getGoogleOAuthAuthorizationUrl } from "@/features/auth/server";

export function OAuthButtons() {
  const [isPending, startTransition] = useTransition();

  const handleOAuth = () => {
    startTransition(async () => {
      const authorizationUrl = await getGoogleOAuthAuthorizationUrl();

      // A top-level redirect keeps the authorization flow in the current
      // browser session. Popups can be blocked or open in another session.
      window.location.assign(authorizationUrl);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full"
        disabled={isPending}
        onClick={handleOAuth}
        type="button"
      >
        <IconBrandGoogle className="size-4 fill-primary-foreground/25 stroke-none" />
        Continue with Google
      </Button>
    </div>
  );
}
