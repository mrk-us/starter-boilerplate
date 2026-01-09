import { v } from "convex/values";

export const subscriptionStatusSchema = v.object({
	tier: v.union(v.literal("free"), v.literal("pro")),
	isPro: v.boolean(),
	productKey: v.union(
		v.literal("proMonthly"),
		v.literal("proYearly"),
		v.null(),
	),
	interval: v.union(v.literal("month"), v.literal("year"), v.null()),
	currentPeriodEnd: v.union(v.string(), v.null()),
	cancelAtPeriodEnd: v.boolean(),
	status: v.union(v.string(), v.null()),
});
