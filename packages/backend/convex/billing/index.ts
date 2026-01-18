import { StripeSubscriptions } from "@convex-dev/stripe";
import { components } from "../_generated/api";

/**
 * Stripe client configuration
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret (whsec_...)
 */
export const stripe = new StripeSubscriptions(components.stripe, {});
