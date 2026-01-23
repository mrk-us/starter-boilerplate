import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		authId: v.string(),
		email: v.string(),
		name: v.string(),
		// Legacy field - kept for backwards compatibility with existing data
		profilePictureUrl: v.optional(v.string()),
		// Convex storage ID for the profile picture (URL is generated on-the-fly)
		profilePictureStorageId: v.optional(v.id("_storage")),
		setupComplete: v.optional(v.boolean()),
		// Cached Stripe customer ID
		stripeCustomerId: v.optional(v.string()),
	})
		.index("authId", ["authId"])
		.index("email", ["email"]),
});
