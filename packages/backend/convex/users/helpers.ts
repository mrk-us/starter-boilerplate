"use node";

import { tryCatch } from "@repo/shared";
import { ConvexError } from "convex/values";
import Stripe from "stripe";
import { components } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { STRIPE_API_VERSION } from "../billing/constants";
import { ERROR_CODE, ERROR_MESSAGE } from "../errors/constants";

/**
 * Get Stripe client instance
 */
export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new ConvexError({
      code: ERROR_CODE.UNKNOWN,
      message: ERROR_MESSAGE.UNKNOWN,
    });
  }
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

/**
 * Cancel user's subscription if they have one (non-blocking)
 */
export async function cancelUserSubscription(
  ctx: ActionCtx,
  userId: string
): Promise<void> {
  const subscriptions = await ctx.runQuery(
    components.stripe.public.listSubscriptionsByUserId,
    { userId }
  );

  const activeSubscription = subscriptions.find(
    (sub: { status: string }) =>
      sub.status === "active" || sub.status === "trialing"
  );

  if (activeSubscription) {
    const stripeClient = getStripeClient();
    const { error: cancelError } = await tryCatch(
      stripeClient.subscriptions.cancel(activeSubscription.stripeSubscriptionId)
    );
    if (cancelError) {
      console.warn(
        "[cancelUserSubscription] Failed to cancel subscription:",
        cancelError.message
      );
    }
  }
}
