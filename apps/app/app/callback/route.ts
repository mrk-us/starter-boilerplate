import { handleAuth } from "@workos-inc/authkit-nextjs";
import type { NextRequest } from "next/server";
import { getReturnPath } from "@/features/auth/return-path";
import { syncUserToDb } from "@/features/auth/server";

const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

export async function GET(request: NextRequest) {
  let returnPath: string | undefined;
  const response = await handleAuth({
    // Behind a proxy, request.url is the internal address. WorkOS sends the
    // browser back through the redirect URI, so its origin is the public one.
    baseURL: redirectUri ? new URL(redirectUri).origin : undefined,
    // A relative Location stays correct behind a proxy, where request.url does not
    onError: () =>
      new Response(null, {
        headers: { Location: "/sign-in?error=oauth" },
        status: 307,
      }),
    onSuccess: async ({ accessToken, state }) => {
      // Sync user to Convex DB (SetupGuard handles redirect to /setup for new users)
      await syncUserToDb(accessToken);
      returnPath = state;
    },
    returnPathname: "/",
  })(request);

  // AuthKit keeps only the path and query of a return path, so restore the
  // complete destination from verified state, keeping the session cookies.
  if (returnPath !== undefined) {
    response.headers.set("Location", getReturnPath(returnPath));
  }

  return response;
}
