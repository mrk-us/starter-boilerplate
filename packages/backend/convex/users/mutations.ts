import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { requireUser } from "../auth/helpers";
import { ERROR_CODE } from "../errors/constants";
import { r2 } from "../r2";
import { PROFILE_PICTURE_VALIDATION } from "./constants";

/**
 * Internal mutation: Sync a user from Clerk
 *
 * The profile always comes from Clerk itself — either a signed `user.*` webhook
 * or a Backend API read in `users.actions.ensureUser` — because `users.email`
 * is what the Stripe customer lookup matches on.
 */
export const syncUserFromAuth = internalMutation({
  args: {
    authId: v.string(),
    email: v.string(),
    name: v.string(),
    profilePictureUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .unique();

    if (!user) {
      await ctx.db.insert("users", {
        authId: args.authId,
        email: args.email,
        name: args.name,
        profilePictureUrl: args.profilePictureUrl,
        setupComplete: false,
      });

      return { created: true };
    }

    await ctx.db.patch(user._id, {
      email: args.email,
      profilePictureUrl: args.profilePictureUrl,
      // Clerk has no name for email/password sign-ups, so the setup flow owns
      // the name until Clerk actually has one.
      ...(args.name ? { name: args.name } : {}),
    });

    return { created: false };
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
 * Update the current user's profile picture (R2 storage)
 * Validates file, deletes old picture if exists, then saves new key
 */
export const updateProfilePicture = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Validate uploaded file metadata (server-side security check)
    const metadata = await r2.getMetadata(ctx, args.key);

    if (metadata) {
      // Validate content type
      const allowedTypes =
        PROFILE_PICTURE_VALIDATION.allowedTypes as readonly string[];

      if (
        metadata.contentType &&
        !allowedTypes.includes(metadata.contentType)
      ) {
        // Delete invalid file
        await tryCatch(r2.deleteObject(ctx, args.key));
        throw new ConvexError({
          code: ERROR_CODE.INVALID_INPUT,
          message:
            "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
        });
      }

      // Validate file size
      if (
        metadata.size &&
        metadata.size > PROFILE_PICTURE_VALIDATION.maxSizeBytes
      ) {
        // Delete invalid file
        await tryCatch(r2.deleteObject(ctx, args.key));
        throw new ConvexError({
          code: ERROR_CODE.INVALID_INPUT,
          message: `File size must be less than ${PROFILE_PICTURE_VALIDATION.maxSizeMB}MB.`,
        });
      }
    }

    // Delete old profile picture from R2 (non-critical)
    if (user.profilePictureKey) {
      await tryCatch(r2.deleteObject(ctx, user.profilePictureKey));
    }

    // Save new key
    await ctx.db.patch(user._id, {
      profilePictureKey: args.key,
    });

    return { success: true };
  },
});

/**
 * Internal mutation: Complete user setup by authId
 * Called by the completeSetup action after updating Clerk
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

    const wasAlreadyComplete = user.setupComplete === true;

    await ctx.db.patch(user._id, {
      name: args.name,
      setupComplete: true,
    });

    // Onboarding is reachable again from a bookmark or the back button, so the
    // welcome email belongs to the first completion only.
    if (!wasAlreadyComplete) {
      await ctx.scheduler.runAfter(
        0,
        internal.emails.actions.sendWelcomeEmail,
        {
          email: user.email,
          name: args.name,
        }
      );
    }

    return { success: true };
  },
});

/**
 * Remove the current user's profile picture from R2
 */
export const removeProfilePicture = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Delete from R2 (non-critical)
    if (user.profilePictureKey) {
      await tryCatch(r2.deleteObject(ctx, user.profilePictureKey));
    }

    // Clear the key
    await ctx.db.patch(user._id, {
      profilePictureKey: undefined,
    });

    return { success: true };
  },
});

/**
 * Internal mutation: Update user's Stripe customer ID
 */
export const updateStripeCustomerId = internalMutation({
  args: {
    stripeCustomerId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
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

    // Delete profile picture from R2 (non-critical)
    if (user.profilePictureKey) {
      await tryCatch(r2.deleteObject(ctx, user.profilePictureKey));
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
