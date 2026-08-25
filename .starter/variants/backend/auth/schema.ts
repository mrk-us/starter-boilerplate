import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    email: v.string(),
    name: v.string(),
    profilePictureUrl: v.optional(v.string()),
    setupComplete: v.optional(v.boolean()),
  })
    .index("authId", ["authId"])
    .index("email", ["email"]),
});
