import { handleAuth } from "@workos-inc/authkit-nextjs";
import { syncUserToDb } from "@/features/auth/server";

const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

export const GET = handleAuth({
  // Behind a proxy, request.url is the internal address. WorkOS sends the
  // browser back through the redirect URI, so its origin is the public one.
  baseURL: redirectUri ? new URL(redirectUri).origin : undefined,
  // A relative Location stays correct behind a proxy, where request.url does not
  onError: () =>
    new Response(null, {
      headers: { Location: "/sign-in?error=oauth" },
      status: 307,
    }),
  onSuccess: async ({ accessToken }) => {
    // Sync user to Convex DB (SetupGuard handles redirect to /setup for new users)
    await syncUserToDb(accessToken);
  },
  returnPathname: "/",
});
