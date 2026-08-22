import { v } from "convex/values";

/**
 * Subscription schema
 */
export const subscriptionSchema = v.object({
  cancelAtPeriodEnd: v.boolean(),
  currentPeriodEnd: v.union(v.string(), v.null()),
  interval: v.union(v.literal("month"), v.literal("year"), v.null()),
  plan: v.union(v.literal("free"), v.literal("pro")),
  status: v.union(v.string(), v.null()),
});
