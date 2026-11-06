import type { StripeEventHandlers } from "@convex-dev/stripe";
import { internal } from "../_generated/api";
import { STRIPE_PRICE_LOOKUP_KEY } from "./constants";

/**
 * Stripe webhook event handlers
 *
 * These handlers are called when Stripe sends webhook events.
 * Add custom logic here to handle subscription lifecycle events.
 *
 *  Required events in Stripe Dashboard:
 * - checkout.session.completed
 * - customer.created
 * - customer.updated
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.created
 * - invoice.finalized
 * - invoice.paid
 * - invoice.payment_failed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 */
export const stripeEventHandlers: StripeEventHandlers = {
  "customer.subscription.created": async (ctx, event) => {
    const subscription = event.data.object;

    const proPlan =
      subscription.metadata.priceLookupKey ===
        STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY ||
      subscription.metadata.priceLookupKey ===
        STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY;

    // Only send welcome email for Pro subscriptions
    if (proPlan) {
      await ctx.runMutation(
        internal.billing.mutations.sendProWelcomeEmailOnce,
        {
          stripeSubscriptionId: subscription.id,
          userId: subscription.metadata.userId ?? "",
        }
      );
    }
  },

  "customer.subscription.deleted": (_ctx, event) => {
    console.log("Subscription cancelled:", event.data.object.id);
    return Promise.resolve();
  },

  "customer.subscription.updated": (_ctx, event) => {
    const subscription = event.data.object;
    if (subscription.cancel_at_period_end) {
      const cancellationDate = subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : "the end of the current billing period";

      console.log(
        "Subscription set to cancel:",
        subscription.id,
        "at",
        cancellationDate
      );
    }
    return Promise.resolve();
  },
};

/**
 * Called for ALL Stripe events - useful for logging/analytics
 */
export function onStripeEvent(
  _ctx: unknown,
  event: { type: string }
): Promise<void> {
  console.log("Stripe event received:", event.type);
  return Promise.resolve();
}
