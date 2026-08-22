"use node";

import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { clerk } from "../auth/clerk";
import { requireAuthId } from "../auth/helpers";
import {
  AUTH_ERROR_CODE,
  ERROR_CODE,
  ERROR_MESSAGE,
} from "../errors/constants";
import { rateLimiter } from "../rateLimiter";
import { cancelUserSubscription } from "./helpers";
import { userSchema } from "./validation";

function parseName(name: string): string {
  const result = userSchema.pick({ name: true }).safeParse({
    name: name.trim(),
  });

  if (!result.success) {
    throw new ConvexError({
      code: ERROR_CODE.INVALID_INPUT,
      message: result.error.issues[0]?.message ?? "Invalid name",
    });
  }

  return result.data.name;
}

/**
 * The app stores a single display name while Clerk splits first and last, so
 * the whole name goes into `firstName` and `lastName` is cleared to keep the
 * two representations from drifting apart.
 */
async function setClerkName(authId: string, name: string) {
  const { error } = await tryCatch(
    clerk.users.updateUser(authId, { firstName: name, lastName: "" })
  );

  if (error) {
    console.error("[setClerkName] Failed to update Clerk user:", error.message);
    throw new ConvexError({
      code: AUTH_ERROR_CODE.UPDATE_USER_FAILED,
      message: ERROR_MESSAGE.UNKNOWN,
    });
  }
}

/**
 * Update user's name (updates both Clerk and Convex DB)
 */
export const updateName = action({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await requireAuthId(ctx);
    const name = parseName(args.name);

    await setClerkName(authId, name);

    await ctx.runMutation(internal.users.mutations.updateUserName, {
      authId,
      name,
    });

    return { success: true };
  },
});

/**
 * Complete user setup (updates Clerk with name, marks setupComplete in DB)
 * User should already exist from sign-up - this just completes their profile
 */
export const completeSetup = action({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await requireAuthId(ctx);
    const name = parseName(args.name);

    await setClerkName(authId, name);

    // Update Convex DB and send welcome email
    await ctx.runMutation(internal.users.mutations.completeSetupInternal, {
      authId,
      name,
    });

    return { success: true };
  },
});

/**
 * Public action: Delete user account (cancels subscription, deletes from Clerk and db)
 */
export const deleteUser = action({
  args: {},
  handler: async (ctx) => {
    const authId = await requireAuthId(ctx);

    // Rate limit
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "deleteUser", {
      key: authId,
    });

    if (!ok) {
      throw new ConvexError({
        code: ERROR_CODE.RATE_LIMITED,
        message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 3_600_000)} hours.`,
      });
    }

    // Get user for subscription cancellation
    const user = await ctx.runQuery(internal.users.queries.getUserByAuthId, {
      authId,
    });

    // Cancel subscription before Clerk deletion (non-blocking)
    if (user) {
      await cancelUserSubscription(ctx, user._id);
    }

    const { error: deleteClerkUserError } = await tryCatch(
      clerk.users.deleteUser(authId)
    );

    if (deleteClerkUserError) {
      console.error(
        "Failed to delete user from auth provider:",
        deleteClerkUserError.message
      );
      throw new ConvexError({
        code: AUTH_ERROR_CODE.DELETE_USER_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }

    // Delete from DB (don't throw - Clerk deletion succeeded, the user.deleted
    // webhook cleans up if this fails)
    if (user) {
      const { error: deleteDbUserError } = await tryCatch(
        ctx.runMutation(internal.users.mutations.deleteUser, { authId })
      );

      if (deleteDbUserError) {
        console.error(
          "[deleteUser] Failed to delete user from db:",
          deleteDbUserError.message
        );
      }
    }

    return { success: true };
  },
});

/**
 * Internal action: Delete user and cancel subscription
 * Called by the webhook handler when a user is deleted from Clerk
 */
export const deleteUserWithSubscription = internalAction({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.queries.getUserByAuthId, {
      authId: args.authId,
    });

    // User already deleted - idempotency
    if (!user) {
      console.warn(
        "[deleteUserWithSubscription] User already deleted:",
        args.authId
      );
      return { success: true };
    }

    // Cancel subscription if user has one
    await cancelUserSubscription(ctx, user._id);

    // Delete from DB
    await ctx.runMutation(internal.users.mutations.deleteUser, {
      authId: args.authId,
    });

    return { success: true };
  },
});
