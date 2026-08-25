import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

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
