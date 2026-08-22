import type { Infer } from "convex/values";
import type {
  STRIPE_PRICE_LOOKUP_KEY,
  SUBSCRIPTION_INTERVAL,
  SUBSCRIPTION_PLAN,
  SUBSCRIPTION_PRICING,
} from "./constants";
import type { subscriptionSchema } from "./validation";

/**
 * User subscription status
 */
export type UserSubscription = Infer<typeof subscriptionSchema>;

/**
 * Subscription plan
 */
export type SubscriptionPlan =
  (typeof SUBSCRIPTION_PLAN)[keyof typeof SUBSCRIPTION_PLAN];

/**
 * Subscription interval
 */
export type SubscriptionInterval =
  (typeof SUBSCRIPTION_INTERVAL)[keyof typeof SUBSCRIPTION_INTERVAL];

/**
 * Stripe price lookup keys
 */
export type StripePriceLookupKey =
  (typeof STRIPE_PRICE_LOOKUP_KEY)[keyof typeof STRIPE_PRICE_LOOKUP_KEY];

/**
 * Subscription pricing
 */
export type SubscriptionPricing =
  (typeof SUBSCRIPTION_PRICING)[keyof typeof SUBSCRIPTION_PRICING];

/**
 * Product information
 */
export interface ProductInfo {
  id: string;
  interval: SubscriptionInterval;
  name: string;
  priceAmount: number;
  priceCurrency: string;
}
