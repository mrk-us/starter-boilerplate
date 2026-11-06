import { handleAuth } from "@workos-inc/authkit-nextjs";
import { syncUserToDb } from "@/features/auth/server";

export const GET = handleAuth({
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
