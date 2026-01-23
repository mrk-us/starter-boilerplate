import type { AuthConfig } from "convex/server";
import { ConvexError } from "convex/values";
import { ERROR_CODE, ERROR_MESSAGE } from "./errors/constants";

if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
	throw new ConvexError({
		code: ERROR_CODE.UNKNOWN,
		message: ERROR_MESSAGE.UNKNOWN,
	});
}

export default {
	providers: [
		{
			domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
			applicationID: "convex",
		},
	],
} satisfies AuthConfig;
