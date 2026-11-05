import { Button } from "@repo/ui/components";
import { FormErrorContent } from "@repo/ui/components/form/form-errors";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { getSignInDestination } from "@/features/auth/return-path";
import { getGoogleOAuthAuthorizationUrl } from "@/features/auth/server/oauth";

export function OAuthButtons({
  callbackError,
  redirect,
}: {
  callbackError?: string;
  redirect?: string;
}) {
  const [error, setError] = useState<string | undefined>();
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
      <FormErrorContent errors={error ?? callbackError} />
    </div>
  );
}
