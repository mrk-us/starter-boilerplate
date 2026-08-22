import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
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
   * Password reset: 3 attempts per hour per email
   */
  passwordReset: {
    capacity: 3,
    kind: "token bucket",
    period: HOUR,
    rate: 3,
  },

  /*
   * Email verification rate limit: 1 attempt per minute per email
   */
  resendEmailVerification: {
    capacity: 1,
    kind: "token bucket",
    period: MINUTE,
    rate: 1,
  },
});
