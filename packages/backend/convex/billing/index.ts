import { StripeSubscriptions } from "@convex-dev/stripe";
import { components } from "../_generated/api";
import { STRIPE_API_VERSION } from "./constants";

/**
 * Stripe client configuration
 *
 * Environment variables required:
 * - STRIPE_SECRET_KEY: Your Stripe secret key (sk_test_... or sk_live_...)
 * - STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret (whsec_...)
 */
export const stripe = new StripeSubscriptions(components.stripe, {
  apiVersion: STRIPE_API_VERSION,
});

/**
 * Client-safe exports (no "use node" dependencies)
 * For server-only exports (actions, queries, helpers), import directly from their files:
 * - import { ... } from "./billing/actions"
 * - import { ... } from "./billing/queries"
 * - import { ... } from "./billing/helpers"
 */
export * from "./constants";
export * from "./types";
export * from "./validation";
