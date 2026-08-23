import { DAY, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// TODO: Lower rates for prod
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  /*
   * Check email rate limit: 100 attempts per day per email
   */
  checkEmail: {
    capacity: 100,
    kind: "token bucket",
    period: DAY,
    rate: 100,
  },

  /*
   * Account deletion: 5 attempt per day per user
   */
  deleteUser: {
    capacity: 5,
    kind: "token bucket",
    period: DAY,
    rate: 5,
  },

  /*
   * One delivery per Clerk password reset email, keyed by the Clerk email id
   *
   * Clerk retries `email.created` until it gets a 2xx, so the same email can
   * arrive more than once. Clerk applies its own per-user send limits, so this
   * must never throttle a code the user actually asked for again.
   */
  passwordResetEmailDelivery: {
    capacity: 1,
    kind: "token bucket",
    period: DAY,
    rate: 1,
  },

  /*
   * One delivery per Clerk verification email, keyed by the Clerk email id
   * (see `passwordResetEmailDelivery`)
   */
  verificationEmailDelivery: {
    capacity: 1,
    kind: "token bucket",
    period: DAY,
    rate: 1,
  },
});
