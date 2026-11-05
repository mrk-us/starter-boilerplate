import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { getSignInDestination } from "@/features/auth/return-path";
import { getGoogleOAuthAuthorizationUrl } from "@/features/auth/server/oauth";

export function OAuthButtons({ redirect }: { redirect?: string }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const handleOAuth = () => {
    startTransition(async () => {
      setError(undefined);
      try {
        const authorizationUrl = await getGoogleOAuthAuthorizationUrl({
          data: getSignInDestination(redirect, window.location.hash),
        });

        // A top-level redirect keeps the authorization flow in the current
        // browser session. Popups can be blocked or open in another session.
        window.location.assign(authorizationUrl);
      } catch {
        setError("We couldn't start sign-in. Please try again.");
      }
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
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
