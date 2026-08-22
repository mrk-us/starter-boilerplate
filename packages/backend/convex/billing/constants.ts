/**
 * Subscription plan
 */
export const SUBSCRIPTION_PLAN = {
  FREE: "free",
  PRO: "pro",
} as const;

/**
 * Subscription interval
 */
export const SUBSCRIPTION_INTERVAL = {
  MONTH: "month",
  YEAR: "year",
} as const;

/**
 * Stripe API contract used by direct calls, component calls, and webhooks.
 */
export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

/**
 * Stripe Price Lookup Keys
 * These correspond to the lookup_key set in Stripe Dashboard for each price
 */
export const STRIPE_PRICE_LOOKUP_KEY = {
  PRO_MONTHLY: "pro_monthly",
  PRO_YEARLY: "pro_yearly",
} as const;

/**
 * Pricing information (in USD cents)
 */
export const SUBSCRIPTION_PRICING = {
  PRO_MONTHLY: 800, // $8.00
  PRO_YEARLY: 8000, // $80.00
} as const;
