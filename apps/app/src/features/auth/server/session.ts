import { api } from "@repo/backend/convex/_generated/api";
import { signInSchema } from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared";
import { createServerFn } from "@tanstack/react-start";
import { getConfig, sessionEncryption } from "@workos/authkit-session";
import { getAuthkit } from "@workos/authkit-tanstack-react-start";
import { convexHttpClient, syncUserToDb } from "./user-sync.server";

/**
 * Signs in with email and password and persists the WorkOS session.
 *
 * AuthKit has no "sign in with these tokens" helper for custom UI, so the
 * session is sealed with the same cookie password and TTL `AuthKitCore` uses
 * and handed to the storage adapter directly. Inside a server function the
 * AuthKit request middleware is active, so `saveSession` routes its
 * `Set-Cookie` through the middleware's pending-header channel and onto the
 * RPC response. Tokens never reach the client.
 */
export const signIn = createServerFn({ method: "POST" })
  .validator(signInSchema)
  .handler(async ({ data }) => {
    const { data: authResponse, error } = await tryCatch(
      convexHttpClient.action(api.auth.actions.authenticateWithPassword, {
        email: data.email,
        password: data.password,
      })
    );

    // Server function errors are serialized to the browser, and Convex embeds
    // its request id and source location in the raw message, so only the domain
    // message crosses the boundary.
    if (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }

    await syncUserToDb(authResponse.user);

    const authkit = await getAuthkit();
    const sealedSession = await sessionEncryption.sealData(
      {
        accessToken: authResponse.accessToken,
        impersonator: undefined,
        refreshToken: authResponse.refreshToken,
        user: authResponse.user,
      },
      { password: getConfig("cookiePassword"), ttl: 0 }
    );

    await authkit.saveSession(undefined, sealedSession);
  });
