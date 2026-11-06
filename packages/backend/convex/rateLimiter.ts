import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// TODO: Lower rates for prod
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  /*
   * Auth emails: 10 per hour per recipient, for verification and password reset
   */
  authEmailPerRecipient: {
    capacity: 10,
    kind: "token bucket",
    period: HOUR,
    rate: 10,
  },

  /*
   * Check email ceiling: 1000 attempts per day per email, across all clients
   */
  checkEmail: {
    capacity: 1000,
    kind: "token bucket",
    period: DAY,
    rate: 1000,
  },

  /*
   * Check email: 60 attempts per hour per client
   */
  checkEmailByClient: {
    capacity: 60,
    kind: "token bucket",
    period: HOUR,
    rate: 60,
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
   * Password reset ceiling: 20 attempts per hour per email, across all clients.
   * authEmailPerRecipient limits the email that this can send.
   */
  passwordReset: {
    capacity: 20,
    kind: "token bucket",
    period: HOUR,
    rate: 20,
  },

  /*
   * Password reset: 5 attempts per hour per client
   */
  passwordResetByClient: {
    capacity: 5,
    kind: "token bucket",
    period: HOUR,
    rate: 5,
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
   * Sign in lockout: 100 failed passwords per 30 minutes per email. This is above
   * the per-client limit, so one client cannot lock an account.
   */
  signIn: {
    capacity: 100,
    kind: "token bucket",
    period: HOUR / 2,
    rate: 100,
  },

  /*
   * Sign in: 60 attempts per 30 minutes per client
   */
  signInByClient: {
    capacity: 60,
    kind: "token bucket",
    period: HOUR / 2,
    rate: 60,
  },

  /*
   * Sign up ceiling: 50 attempts per hour per email, across all clients
   */
  signUp: {
    capacity: 50,
    kind: "token bucket",
    period: HOUR,
    rate: 50,
  },

  /*
   * Sign up: 10 attempts per hour per client
   */
  signUpByClient: {
    capacity: 10,
    kind: "token bucket",
    period: HOUR,
    rate: 10,
  },

  /*
   * Email verification code: 10 attempts per hour per user
   */
  verifyEmail: {
    capacity: 10,
    kind: "token bucket",
    period: HOUR,
    rate: 10,
  },
});
