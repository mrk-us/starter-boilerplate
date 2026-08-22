import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    email: v.string(),
    name: v.string(),
    // R2 object key for custom uploaded profile picture
    profilePictureKey: v.optional(v.string()),
    // Profile picture URL synced from Clerk
    profilePictureUrl: v.optional(v.string()),
    setupComplete: v.optional(v.boolean()),
    // Cached Stripe customer ID
    stripeCustomerId: v.optional(v.string()),
  })
    .index("authId", ["authId"])
    .index("email", ["email"]),
});
