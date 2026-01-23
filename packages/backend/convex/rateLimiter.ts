import { DAY, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// TODO: Lower rates for prod
export const rateLimiter = new RateLimiter(components.rateLimiter, {
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
