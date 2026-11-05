import { api } from "@repo/backend/convex/_generated/api";
import type { User } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL environment variable is not set");
}

/**
 * Unauthenticated client for the password authentication action.
 */
export const convexHttpClient = new ConvexHttpClient(convexUrl);

/**
 * Mirrors a freshly authenticated WorkOS user into Convex.
 * Returns true when a new user document was created.
 */
export async function syncUserToDb(
  user: User,
  accessToken: string
): Promise<boolean> {
  // A request-specific client prevents concurrent sign-ins sharing tokens.
  const client = new ConvexHttpClient(convexHttpClient.url);
  client.setAuth(accessToken);
  const exists = await client.query(api.users.queries.userExistsByAuthId, {});

  if (exists) {
    return false;
  }

  const { created } = await client.mutation(api.users.mutations.upsertUser, {
    email: user.email,
    name: user.name ?? user.firstName ?? undefined,
    profilePictureUrl: user.profilePictureUrl ?? undefined,
  });

  return created;
}
