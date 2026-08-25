import type { GenericQueryCtx } from "convex/server";
import { components } from "../_generated/api";
import type { DataModel, Id } from "../_generated/dataModel";
import {
  STRIPE_PRICE_LOOKUP_KEY,
  SUBSCRIPTION_INTERVAL,
  SUBSCRIPTION_PLAN,
} from "./constants";
import type { SubscriptionInterval, UserSubscription } from "./types";

/**
 * Get subscription status for a user by querying the Stripe component's subscriptions table.
 */
export async function getSubscriptionStatusForUser(
  ctx: GenericQueryCtx<DataModel>,
  userId: Id<"users">
): Promise<UserSubscription> {
  // Query the Stripe component's subscriptions by userId
  const subscriptions = await ctx.runQuery(
    components.stripe.public.listSubscriptionsByUserId,
    { userId }
  );

  // Find active subscription
  const activeSubscription = subscriptions.find(
    (sub) => sub.status === "active" || sub.status === "trialing"
  );

  if (!activeSubscription) {
    return {
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      interval: null,
      plan: SUBSCRIPTION_PLAN.FREE,
      status: null,
    };
  }

  // Determine interval and product key from price lookup key in metadata
  // or fall back to price interval from the subscription
  const priceLookupKey = activeSubscription.metadata?.priceLookupKey as
    | string
    | undefined;

  let interval: SubscriptionInterval;

  if (priceLookupKey === STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY) {
    interval = SUBSCRIPTION_INTERVAL.YEAR;
  } else {
    // Default to monthly
    interval = SUBSCRIPTION_INTERVAL.MONTH;
  }

  // Convert currentPeriodEnd timestamp to ISO string
  const currentPeriodEnd = activeSubscription.currentPeriodEnd
    ? new Date(activeSubscription.currentPeriodEnd * 1000).toISOString()
    : null;

  return {
    cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
    currentPeriodEnd,
    interval,
    plan: SUBSCRIPTION_PLAN.PRO,
    status: activeSubscription.status,
  };
}

/**
 * Create a SHA-256 hash of the input data using Web Crypto API.
 * Works in browsers, Cloudflare Workers, Convex runtime, and Node.js 15+.
 * Returns a truncated 16-character hex string for URL-friendly use.
 */
async function createSha256Hash(data: string): Promise<string> {
  // Encode the string as a Uint8Array (UTF-8)
  const encoder = new TextEncoder().encode(data);
  // Hash the message using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder);

  // Convert the ArrayBuffer to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex.slice(0, 16);
}

/**
 * Create a deterministic hash of subscription state.
 * Used to detect if subscription has changed (e.g., webhook updated it).
 */
export function createSubscriptionHash(
  subscription: UserSubscription
): Promise<string> {
  const normalized = JSON.stringify({
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    interval: subscription.interval,
    plan: subscription.plan,
    status: subscription.status,
  });
  return createSha256Hash(normalized);
}
