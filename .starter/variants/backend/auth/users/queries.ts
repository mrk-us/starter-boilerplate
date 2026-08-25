import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getAuthenticatedUser } from "../auth/helpers";

/**
 * Check if user exists by authId
 * Public query used by auth callback to skip sync for returning users
 */
export const userExistsByAuthId = query({
  args: { authId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .first();
    return user !== null;
  },
  returns: v.boolean(),
});

/**
 * Get user by ID (internal)
 */
export const getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => await ctx.db.get(args.userId),
});

/**
 * Get user by email
 */
export const getUserByEmail = internalQuery({
  args: {
    email: v.union(v.string(), v.array(v.string()), v.null()),
  },
  handler: async (ctx, args) => {
    if (!args.email) {
      return null;
    }

    const emailToSearch = Array.isArray(args.email)
      ? args.email[0]
      : args.email;

    if (!emailToSearch || typeof emailToSearch !== "string") {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", emailToSearch))
      .unique();
  },
});

/**
 * Get user by authId
 */
export const getUserByAuthId = internalQuery({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.authId) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("authId", (q) => q.eq("authId", args.authId))
      .unique();
  },
});

/**
 * Get the current database user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx, _args) => await getAuthenticatedUser(ctx),
});
