import { tryCatch } from "@repo/shared/utils";
import { Button } from "@repo/ui/components";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useState, useTransition } from "react";
import { useOAuthSignIn } from "@/features/auth/hooks";

export function OAuthButtons() {
  const { signInWithOAuth } = useOAuthSignIn();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOAuth = () => {
    setErrorMessage(null);

    startTransition(async () => {
      // A top-level redirect rather than a popup. Popups are blocked by
      // browsers, and the Electron shell hands `window.open` to the system
      // browser, which would strand the session cookie there.
      const { error } = await tryCatch(signInWithOAuth("oauth_google"));

      if (error) {
        setErrorMessage(error.message);
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
        <IconBrandGoogle className="size-4 fill-white/35 stroke-none" />
        Continue with Google
      </Button>

      {errorMessage && (
        <p className="text-destructive text-xs">{errorMessage}</p>
      )}
    </div>
  );
}
