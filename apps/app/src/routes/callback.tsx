import { createFileRoute } from "@tanstack/react-router";
import { handleCallbackRoute } from "@workos/authkit-tanstack-react-start";
import { syncUserToDb } from "@/features/auth/server/user-sync.server";

export const Route = createFileRoute("/callback")({
  server: {
    handlers: {
      GET: handleCallbackRoute({
        // Without this the SDK answers a failed callback with a raw JSON body;
        // the underlying error is still logged server-side.
        errorRedirectUrl: "/sign-in",
        onSuccess: async ({ user }) => {
          await syncUserToDb(user);
        },
        returnPathname: "/",
      }),
    },
  },
});
