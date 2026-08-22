"use node";

import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { action, internalAction } from "../_generated/server";
import { requireAuthId } from "../auth/helpers";
import { authKit } from "../auth/index";
import {
  AUTH_ERROR_CODE,
  ERROR_CODE,
  ERROR_MESSAGE,
} from "../errors/constants";
import { rateLimiter } from "../rateLimiter";
import { cancelUserSubscription } from "./helpers";
import { userSchema } from "./validation";

/**
 * Update user's name (updates both WorkOS and Convex DB)
 */
export const updateName = action({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await requireAuthId(ctx);

    // Validate input
    const validationResult = userSchema.pick({ name: true }).safeParse({
      name: args.name.trim(),
    });

    if (!validationResult.success) {
      throw new ConvexError({
        code: ERROR_CODE.INVALID_INPUT,
        message: validationResult.error.issues[0]?.message ?? "Invalid name",
      });
    }

    const { name } = validationResult.data;

    // Update WorkOS user
    const { error: workosError } = await tryCatch(
      authKit.workos.userManagement.updateUser({
        firstName: name,
        lastName: "",
        userId: authId,
      })
    );

    if (workosError) {
      console.error("Failed to update WorkOS user:", workosError.message);
      throw new ConvexError({
        code: AUTH_ERROR_CODE.UPDATE_USER_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }

    // Update Convex DB
    await ctx.runMutation(internal.users.mutations.updateUserName, {
      authId,
      name,
    });

    return { success: true };
  },
});

/**
 * Complete user setup (updates WorkOS with name, marks setupComplete in DB)
 * User should already exist from auth callback - this just completes their profile
 */
export const completeSetup = action({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const authId = await requireAuthId(ctx);

    // Validate input
    const validationResult = userSchema.pick({ name: true }).safeParse({
      name: args.name.trim(),
    });

    if (!validationResult.success) {
      throw new ConvexError({
        code: ERROR_CODE.INVALID_INPUT,
        message: validationResult.error.issues[0]?.message ?? "Invalid name",
      });
    }

    const { name } = validationResult.data;

    // Update WorkOS user with name
    const { error: workosError } = await tryCatch(
      authKit.workos.userManagement.updateUser({
        firstName: name,
        userId: authId,
      })
    );

    if (workosError) {
      console.error("Failed to update WorkOS user:", workosError.message);
      throw new ConvexError({
        code: AUTH_ERROR_CODE.UPDATE_USER_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }

    // Update Convex DB and send welcome email
    await ctx.runMutation(internal.users.mutations.completeSetupInternal, {
      authId,
      name,
    });

    return { success: true };
  },
});

/**
 * Public action: Delete user account (cancels subscription, deletes from WorkOS and db)
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

    // Cancel subscription before WorkOS deletion (non-blocking)
    if (user) {
      await cancelUserSubscription(ctx, user._id);
    }

    // Delete from WorkOS
    const { error: deleteWorkosUserError } = await tryCatch(
      authKit.workos.userManagement.deleteUser(authId)
    );

    if (deleteWorkosUserError) {
      console.error(
        "Failed to delete user from auth provider:",
        deleteWorkosUserError.message
      );
      throw new ConvexError({
        code: AUTH_ERROR_CODE.DELETE_USER_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }

    // Delete from DB (don't throw - WorkOS deletion succeeded, webhook will clean up if needed)
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
 * Called by webhook handler when user is deleted from WorkOS
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
