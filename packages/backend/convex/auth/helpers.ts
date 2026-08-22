import { ConvexError } from "convex/values";
import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { AUTH_ERROR_CODE, ERROR_MESSAGE } from "../errors/constants";

/**
 * Get the authenticated user's Clerk ID from the Convex identity
 * Returns null if not authenticated
 */
export async function getAuthId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  // Clerk puts the user id in the `sub` claim of the session token.
  return identity.subject;
}

/**
 * Require authentication - throws NOT_AUTHENTICATED if not signed in
 * Returns the Clerk user ID
 */
export async function requireAuthId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const authId = await getAuthId(ctx);

  if (!authId) {
    throw new ConvexError({
      code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
      message: ERROR_MESSAGE.NOT_AUTHENTICATED,
    });
  }

  return authId;
}

/**
 * Get the authenticated user from the database
 * Returns null if not authenticated or user not found
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const authId = await getAuthId(ctx);

  if (!authId) {
    return null;
  }

  return ctx.db
    .query("users")
    .withIndex("authId", (q) => q.eq("authId", authId))
    .unique();
}

/**
 * Require authenticated user - throws NOT_AUTHENTICATED if not signed in or user not found
 * Use this when you need the user record (most mutations)
 */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (!user) {
    throw new ConvexError({
      code: AUTH_ERROR_CODE.NOT_AUTHENTICATED,
      message: ERROR_MESSAGE.NOT_AUTHENTICATED,
    });
  }

  return user;
}
