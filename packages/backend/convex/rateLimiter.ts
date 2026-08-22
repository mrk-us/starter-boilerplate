import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// TODO: Lower rates for prod
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  /*
   * Check email rate limit: 10 attempts per day per email
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
   * Email verification rate limit: 1 attempt per minute per id
   */
  resendEmailVerification: {
    capacity: 1,
    kind: "token bucket",
    period: MINUTE,
    rate: 1,
  },

  /*
   * Email verification rate limit: 5 attempts per hour per id
   */
  resendEmailVerificationMaxAttempts: {
    capacity: 5,
    kind: "token bucket",
    period: HOUR,
    rate: 5,
  },

  /*
   * Sign up by IP: 10 attempts per hour
   */
  // TODO: Add IP rate limiting
  // signUpByIp: {
  // 	kind: "token bucket",
  // 	rate: 5,
  // 	period: HOUR,
  // 	capacity: 5,
  // },

  /*
   * Sign in rate limit: 5 attempts per 30 minutes per email
   */
  signIn: {
    capacity: 100,
    kind: "token bucket",
    period: HOUR / 2,
    rate: 100,
  },
  /*
   * Sign up rate limit: 5 attempts per hour per email
   */
  signUp: {
    capacity: 50,
    kind: "token bucket",
    period: HOUR,
    rate: 50,
  },
});
