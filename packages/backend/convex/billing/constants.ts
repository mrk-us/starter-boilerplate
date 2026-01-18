/**
 * Subscription plan
 */
export const SUBSCRIPTION_PLAN = {
	FREE: "free",
	PRO: "pro",
} as const;

export type SUBSCRIPTION_PLAN =
	(typeof SUBSCRIPTION_PLAN)[keyof typeof SUBSCRIPTION_PLAN];

/**
 * Subscription interval
 */
export const SUBSCRIPTION_INTERVAL = {
	MONTH: "month",
	YEAR: "year",
} as const;

export type SUBSCRIPTION_INTERVAL =
	(typeof SUBSCRIPTION_INTERVAL)[keyof typeof SUBSCRIPTION_INTERVAL];

/**
 * Stripe Price Lookup Keys
 * These correspond to the lookup_key set in Stripe Dashboard for each price
 */
export const STRIPE_PRICE_LOOKUP_KEYS = {
	PRO_MONTHLY: "pro_monthly",
	PRO_YEARLY: "pro_yearly",
} as const;

export type STRIPE_PRICE_LOOKUP_KEYS =
	(typeof STRIPE_PRICE_LOOKUP_KEYS)[keyof typeof STRIPE_PRICE_LOOKUP_KEYS];

/**
 * Pricing information (in USD cents)
 */
export const SUBSCRIPTION_PRICING = {
	PRO_MONTHLY: 800, // $8.00
	PRO_YEARLY: 8000, // $80.00
} as const;

export type SUBSCRIPTION_PRICING =
	(typeof SUBSCRIPTION_PRICING)[keyof typeof SUBSCRIPTION_PRICING];
