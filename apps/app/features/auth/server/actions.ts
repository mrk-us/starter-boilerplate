"use server";

import { api } from "@repo/backend/convex/_generated/api";
import {
  type ClientProof,
  createClientProof,
} from "@repo/backend/convex/auth/proofs";
import { getErrorMessage, tryCatch } from "@repo/shared";
import { getSignInUrl, saveSession } from "@workos-inc/authkit-nextjs";
import { ConvexHttpClient } from "convex/browser";
import { headers } from "next/headers";
import { getReturnPath } from "../return-path";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(convexUrl);

const GOOGLE_OAUTH_PROVIDER = "GoogleOAuth";

export async function getGoogleOAuthAuthorizationUrl(
  returnTo: string
): Promise<string> {
  const authorizationUrl = new URL(
    await getSignInUrl({ returnTo: getReturnPath(returnTo) })
  );

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
export async function syncUserToDb(accessToken: string): Promise<boolean> {
  const authenticatedClient = new ConvexHttpClient(client.url);
  authenticatedClient.setAuth(accessToken);
  const exists = await authenticatedClient.query(
    api.users.queries.userExistsByAuthId,
    {}
  );

  if (exists) {
    return false;
  }

  const { created } = await authenticatedClient.action(
    api.auth.actions.syncCurrentUser,
    {}
  );
  return created;
}

/**
 * Calls an anonymous Convex auth action with the signed address of the visitor.
 * Returns errors, because React replaces the message of a thrown Server Action
 * error in production
 */
async function callWithClientProof<T>(
  run: (clientProof: ClientProof) => Promise<T>
) {
  const headersList = await headers();
  const { data, error } = await tryCatch(
    createClientProof(headersList.get("x-forwarded-for")).then(run)
  );

  return error ? { error: getErrorMessage(error) } : data;
}

async function signInWithPassword(
  data: { email: string; password: string },
  clientProof: ClientProof
) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3001";
  const protocol = host.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/sign-in`;

  const { data: authResultData, error: authResultError } = await tryCatch(
    client.action(api.auth.actions.authenticateWithPassword, {
      clientProof,
      email: data.email,
      password: data.password,
    })
  );

  if (authResultError) {
    throw new Error(authResultError.message);
  }

  if ("emailVerificationRequired" in authResultData) {
    return {
      verifyAuthId: authResultData.authId,
      verifyToken: authResultData.verifyToken,
    };
  }

  // Sync user to Convex DB
  await syncUserToDb(authResultData.accessToken);

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

/**
 * Sign in with email/password and save session
 */
export async function signIn(data: { email: string; password: string }) {
  return await callWithClientProof((clientProof) =>
    signInWithPassword(data, clientProof)
  );
}

export async function checkEmail(email: string) {
  return await callWithClientProof((clientProof) =>
    client.action(api.auth.actions.checkEmailExists, { clientProof, email })
  );
}

export async function createAccount(data: { email: string; password: string }) {
  return await callWithClientProof((clientProof) =>
    client.action(api.auth.actions.createUserAccount, {
      clientProof,
      email: data.email,
      password: data.password,
    })
  );
}

export async function requestPasswordReset(email: string) {
  return await callWithClientProof((clientProof) =>
    client.action(api.auth.actions.requestPasswordReset, {
      clientProof,
      email,
    })
  );
}
