"use server";

import { api } from "@repo/backend/convex/_generated/api";
import { tryCatch } from "@repo/shared";
import { getSignInUrl, saveSession } from "@workos-inc/authkit-nextjs";
import type { User } from "@workos-inc/node";
import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(convexUrl);

const GOOGLE_OAUTH_PROVIDER = "GoogleOAuth";

export async function getGoogleOAuthAuthorizationUrl(): Promise<string> {
  const authorizationUrl = new URL(await getSignInUrl());

  // getSignInUrl creates the sealed state and verifier cookie required by
  // handleAuth. WorkOS rejects the hosted UI screen hint when a social provider
  // is selected directly, so keep the protected flow but remove that hint.
  authorizationUrl.searchParams.set("provider", GOOGLE_OAUTH_PROVIDER);
  authorizationUrl.searchParams.delete("screen_hint");

  return authorizationUrl.toString();
}

/**
 * Sync user to Convex DB after WorkOS authentication
 * Returns true if new user was created, false if already exists
 */
export async function syncUserToDb(
  user: User,
  accessToken: string
): Promise<boolean> {
  const authenticatedClient = new ConvexHttpClient(client.url);
  authenticatedClient.setAuth(accessToken);
  const exists = await authenticatedClient.query(
    api.users.queries.userExistsByAuthId,
    {}
  );

  if (exists) {
    return false;
  }

  const { created } = await authenticatedClient.mutation(
    api.users.mutations.upsertUser,
    {
      email: user.email,
      name: user.name ?? user.firstName ?? undefined,
      profilePictureUrl: user.profilePictureUrl ?? undefined,
    }
  );
  return created;
}

/**
 * Sign in with email/password and save session
 */
export async function signIn(data: { email: string; password: string }) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/sign-in`;

  const { data: authResultData, error: authResultError } = await tryCatch(
    client.action(api.auth.actions.authenticateWithPassword, {
      email: data.email,
      password: data.password,
    })
  );

  if (authResultError) {
    throw new Error(authResultError.message);
  }

  // Sync user to Convex DB
  await syncUserToDb(authResultData.user, authResultData.accessToken);

  // Save session (tokens stay server-side)
  await saveSession(
    {
      accessToken: authResultData.accessToken,
      impersonator: undefined,
      refreshToken: authResultData.refreshToken,
      user: authResultData.user,
    },
    url
  );

  return { success: true };
}
