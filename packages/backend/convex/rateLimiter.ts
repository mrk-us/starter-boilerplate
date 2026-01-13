import { DAY, HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// TODO: Lower rates for prod
export const rateLimiter = new RateLimiter(components.rateLimiter, {
	/*
	 * Sign up rate limit: 5 attempts per hour per email
	 */
	signUp: {
		kind: "token bucket",
		rate: 50,
		period: HOUR,
		capacity: 50,
	},

	/*
	 * Email verification rate limit: 1 attempt per minute per id
	 */
	resendEmailVerification: {
		kind: "token bucket",
		rate: 1,
		period: MINUTE,
		capacity: 1,
	},

	/*
	 * Email verification rate limit: 5 attempts per hour per id
	 */
	resendEmailVerificationMaxAttempts: {
		kind: "token bucket",
		rate: 5,
		period: HOUR,
		capacity: 5,
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
		kind: "token bucket",
		rate: 50,
		period: HOUR / 2,
		capacity: 50,
	},

	/*
	 * Password reset: 3 attempts per hour per email
	 */
	passwordReset: {
		kind: "token bucket",
		rate: 3,
		period: HOUR,
		capacity: 3,
	},

	/*
	 * Account deletion: 5 attempt per day per user
	 */
	deleteUser: {
		kind: "token bucket",
		rate: 5,
		period: DAY,
		capacity: 5,
	},
});
