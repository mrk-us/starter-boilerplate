import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getAuthenticatedUser, requireUser } from "../auth/helpers";
import {
  createSubscriptionHash,
  getSubscriptionStatusForUser,
} from "./helpers";
import { subscriptionSchema } from "./validation";

/**
 * Require current user for billing - throws if not authenticated
 * Use this in actions where authentication is required
 */
export const requireCurrentUserForBilling = internalQuery({
  args: {},
  handler: async (ctx, _args) => {
    const user = await requireUser(ctx);

    return {
      _id: user._id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    };
  },
});

/**
 * Get subscription status for a specific user (internal)
 */
export const getSubscriptionStatusByUserId = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => getSubscriptionStatusForUser(ctx, args.userId),
  returns: subscriptionSchema,
});

/**
 * Get a hash of the current user's subscription state.
 * Used to detect if subscription changed between checkout start and completion.
 */
export const getSubscriptionHash = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    if (!user) {
      return null;
    }

    const subscription = await getSubscriptionStatusForUser(ctx, user._id);
    return await createSubscriptionHash(subscription);
  },
  returns: v.union(v.string(), v.null()),
});
