/**
 * Auth client configuration
 *
 * Environment variables required:
 * - CLERK_SECRET_KEY: Your Clerk secret key
 * - CLERK_WEBHOOK_SECRET: Your Clerk webhook secret
 * - CLERK_JWT_ISSUER_DOMAIN: Your Clerk JWT issuer domain
 */

/**
 * Client-safe exports
 * For server-only exports (events, helpers), import directly from their files:
 * - import { ... } from "./auth/events"
 * - import { ... } from "./auth/helpers"
 */
export * from "./validation";
