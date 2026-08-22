import { api } from "@repo/backend/convex/_generated/api";
import type { User } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL environment variable is not set");
}

/**
 * Convex client for requests made outside of a signed-in browser session — the
 * OAuth callback and the password sign-in server function, both of which run
 * before the session cookie exists.
 */
export const convexHttpClient = new ConvexHttpClient(convexUrl);

/**
 * Mirrors a freshly authenticated WorkOS user into Convex.
 * Returns true when a new user document was created.
 */
export async function syncUserToDb(user: User): Promise<boolean> {
  const exists = await convexHttpClient.query(
    api.users.queries.userExistsByAuthId,
    { authId: user.id }
  );

  if (exists) {
    return false;
  }

  await convexHttpClient.mutation(api.users.mutations.upsertUser, {
    authId: user.id,
    email: user.email,
    name: user.name ?? user.firstName ?? undefined,
    profilePictureUrl: user.profilePictureUrl ?? undefined,
  });

  return true;
}
