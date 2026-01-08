import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	users: defineTable({
		authId: v.string(),
		email: v.string(),
		name: v.string(),
		// Legacy field - kept for backwards compatibility with existing data
		profilePictureUrl: v.optional(v.string()),
		// R2 object key for the profile picture (URL is generated on-the-fly)
		profilePictureKey: v.optional(v.string()),
		setupCompleted: v.optional(v.boolean()),
	})
		.index("authId", ["authId"])
		.index("email", ["email"]),
});
