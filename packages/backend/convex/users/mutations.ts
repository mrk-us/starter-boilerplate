import { tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";

/**
 * Upsert user - create if doesn't exist, update if exists
 * Called from auth callback to ensure user exists immediately after sign-in/up
 * Public mutation (called from Next.js server action after WorkOS auth)
 */
export const upsertUser = mutation({
  args: {
    authId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .unique();

    if (existingUser) {
      // Update existing user (sync from WorkOS)
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        profilePictureUrl: args.profilePictureUrl,
      });
      return { created: false, userId: existingUser._id };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      authId: args.authId,
      email: args.email,
      name: args.name ?? "",
      profilePictureUrl: args.profilePictureUrl,
      setupComplete: false,
    });

    return { created: true, userId };
  },
});

/**
 * Internal mutation: Update user's name
 */
export const updateUserName = internalMutation({
  args: {
    authId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user from the database (direct db query)
    const user = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .unique();

    // If the user is not found, log an error
    if (!user) {
      console.error("[updateUserName] User not found:", args.authId);
      return { success: false };
    }

    // Update the user's name in the database
    await ctx.db.patch(user._id, {
      name: args.name,
    });

    // Return success
    return { success: true };
  },
});

/**
 * Internal mutation: Complete user setup by authId
 * Called by the completeSetup action after updating WorkOS
 */
export const completeSetupInternal = internalMutation({
  args: {
    authId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .unique();

    if (!user) {
      console.error("[completeSetupInternal] User not found:", args.authId);
      return { success: false };
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      setupComplete: true,
    });

    // Send welcome email
    await ctx.scheduler.runAfter(0, internal.emails.actions.sendWelcomeEmail, {
      email: user.email,
      name: args.name,
    });

    return { success: true };
  },
});

/**
 * Internal mutation: Delete user
 */
export const deleteUser = internalMutation({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .unique();

    // User may already be deleted - idempotency check
    if (!user) {
      console.warn("[deleteUser] User not found:", args.authId);
      return { success: true };
    }

    // Delete user from db
    const { error: deleteUserError } = await tryCatch(ctx.db.delete(user._id));

    if (deleteUserError) {
      console.error(
        "[deleteUser] Failed to delete user from db:",
        deleteUserError.message
      );
    }

    return { success: true };
  },
});
