/**
 * Billing error codes
 */
export const BILLING_ERROR_CODE = {
  ALREADY_SUBSCRIBED: "ALREADY_SUBSCRIBED",
  CHECKOUT_FAILED: "CHECKOUT_FAILED",
  CUSTOMER_DELETE_FAILED: "CUSTOMER_DELETE_FAILED",
  PRODUCTS_SYNC_FAILED: "PRODUCTS_SYNC_FAILED",
  SUBSCRIPTION_CANCEL_FAILED: "SUBSCRIPTION_CANCEL_FAILED",
} as const;

/**
 * Statuses that grant Pro access
 */
export const PRO_SUBSCRIPTION_STATUSES: readonly string[] = [
  "active",
  "trialing",
];

/**
 * Statuses of a subscription that needs a payment. These give no Pro access, but
 * the customer still has the subscription and can fix the payment.
 */
export const PAYMENT_ISSUE_SUBSCRIPTION_STATUSES: readonly string[] = [
  "past_due",
  "paused",
  "unpaid",
];

/**
 * Statuses of a subscription that can no longer charge the customer
 */
export const ENDED_SUBSCRIPTION_STATUSES: readonly string[] = [
  "canceled",
  "incomplete_expired",
];

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
export const STRIPE_API_VERSION = "2026-08-26.dahlia" as const;

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
