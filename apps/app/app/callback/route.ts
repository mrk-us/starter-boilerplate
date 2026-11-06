import { handleAuth } from "@workos-inc/authkit-nextjs";
import { syncUserToDb } from "@/features/auth/server";

export const GET = handleAuth({
  onSuccess: async ({ accessToken }) => {
    // Sync user to Convex DB (SetupGuard handles redirect to /setup for new users)
    await syncUserToDb(accessToken);
  },
  returnPathname: "/",
});
