import { v } from "convex/values";
import { internal } from "../_generated/api";
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

/**
 * Internal mutation: Send the welcome to Pro email once per subscription.
 * Stripe can deliver a webhook more than once, and it can deliver one for a user
 * who was deleted. Neither case is a failure, so Stripe must not retry them.
 */
export const sendProWelcomeEmailOnce = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.userId);
    const user = userId && (await ctx.db.get(userId));

    if (!user || user.proWelcomeSubscriptionId === args.stripeSubscriptionId) {
      return;
    }

    await ctx.db.patch(user._id, {
      proWelcomeSubscriptionId: args.stripeSubscriptionId,
    });
    await ctx.scheduler.runAfter(
      0,
      internal.emails.actions.sendWelcomeToProEmail,
      {
        email: user.email,
        name: user.name,
      }
    );
  },
});
