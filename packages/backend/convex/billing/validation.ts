import { v } from "convex/values";

export const subscriptionStatusSchema = v.object({
	plan: v.union(v.literal("free"), v.literal("pro")),
	interval: v.union(v.literal("month"), v.literal("year"), v.null()),
	status: v.union(v.string(), v.null()),
	currentPeriodEnd: v.union(v.string(), v.null()),
	cancelAtPeriodEnd: v.boolean(),
});
