import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { isDisposableEmail } from "disposable-email-domains-js";
import type { ActionCtx } from "../_generated/server";
import { action, internalAction } from "../_generated/server";
import {
	AuthErrorCode,
	ErrorMessage,
	WorkOSErrorCode,
} from "../errors/constants";
import { rateLimiter } from "../rateLimiter";
import { authKit } from "./index";
import type { AuthenticateResult } from "./types";

/**
 * AuthKit action handler (required by WorkOS AuthKit component)
 */
export const { authKitAction } = authKit.actions({
	userRegistration: async (_ctx, _action, response) => response.allow(),
	authentication: async (_ctx, _action, response) => response.allow(),
});

/**
 * Create user account with email and password
 */
export const createUserAccount = action({
	args: {
		email: v.string(),
		password: v.string(),
	},
	handler: async (ctx, args) => {
		const email = args.email.toLowerCase().trim();

		// Rate limit
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "signUp", {
			key: email,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many sign-up attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
			});
		}

		// Check for disposable email
		if (isDisposableEmail(email)) {
			throw new ConvexError({
				code: AuthErrorCode.DISPOSABLE_EMAIL,
				message: "Temporary email addresses are not allowed",
			});
		}

		// Create user in WorkOS
		const { data: createUserData, error: createUserError } = await tryCatch(
			authKit.workos.userManagement.createUser({
				email,
				password: args.password,
			}),
		);

		if (createUserError) {
			throw new ConvexError({
				code: WorkOSErrorCode.CREATE_USER_FAILED,
				message: createUserError.message,
			});
		}

		// Send verification email for unverified users
		if (!createUserData.emailVerified) {
			await authKit.workos.userManagement.sendVerificationEmail({
				userId: createUserData.id,
			});
		}

		return {
			id: createUserData.id,
			emailVerified: createUserData.emailVerified,
		};
	},
});

/**
 * Verify email with code
 */
export const verifyEmail = action({
	args: {
		authId: v.string(),
		code: v.string(),
	},
	handler: async (_ctx, args) => {
		const { error: verifyEmailError } = await tryCatch(
			authKit.workos.userManagement.verifyEmail({
				userId: args.authId,
				code: args.code,
			}),
		);

		if (verifyEmailError) {
			throw new ConvexError({
				code: WorkOSErrorCode.EMAIL_VERIFICATION_FAILED,
				message: verifyEmailError.message,
			});
		}

		return { success: true };
	},
});

/**
 * Send verification email (shared logic)
 */
async function sendVerificationEmail(ctx: ActionCtx, authId: string) {
	const authUser = await authKit.getAuthUser(ctx);

	// Prevent sending verification emails for other users
	if (authUser && authUser.id !== authId) {
		throw new ConvexError({
			code: AuthErrorCode.UNAUTHORIZED,
			message: ErrorMessage.UNAUTHORIZED,
		});
	}

	// Rate limit per minute
	const perMinute = await rateLimiter.limit(ctx, "resendEmailVerification", {
		key: authId,
	});

	if (!perMinute.ok) {
		throw new ConvexError({
			code: AuthErrorCode.RATE_LIMITED,
			message: `Too many attempts. Please try again in ${Math.ceil(perMinute.retryAfter / 1000)} seconds.`,
		});
	}

	// Rate limit per hour
	const perHour = await rateLimiter.limit(
		ctx,
		"resendEmailVerificationMaxAttempts",
		{ key: authId },
	);

	if (!perHour.ok) {
		throw new ConvexError({
			code: AuthErrorCode.RATE_LIMITED,
			message: `Too many attempts. Please try again in ${Math.ceil(perHour.retryAfter / 60_000)} minutes.`,
		});
	}

	// Send verification email
	const { error: sendVerificationEmailError } = await tryCatch(
		authKit.workos.userManagement.sendVerificationEmail({
			userId: authId,
		}),
	);

	if (sendVerificationEmailError) {
		throw new ConvexError({
			code: WorkOSErrorCode.SEND_VERIFICATION_EMAIL_FAILED,
			message: sendVerificationEmailError.message,
		});
	}
}

/**
 * Resend verification email
 */
export const resendVerificationEmail = action({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		await sendVerificationEmail(ctx, args.authId);
		return { success: true };
	},
});

/**
 * Resend verification email on email change (internal)
 */
export const resendVerificationEmailOnEmailChange = internalAction({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		await sendVerificationEmail(ctx, args.authId);
		return { success: true };
	},
});

/**
 * Authenticate with email and password
 */
export const authenticateWithPassword = action({
	args: {
		email: v.string(),
		password: v.string(),
	},
	handler: async (ctx, args): Promise<AuthenticateResult> => {
		const email = args.email.toLowerCase().trim();

		// Rate limit
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "signIn", {
			key: email,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} ${Math.ceil(retryAfter / 60_000) === 1 ? "minute" : "minutes"}.`,
			});
		}

		const clientId = process.env.WORKOS_CLIENT_ID;

		if (!clientId) {
			console.error("WORKOS_CLIENT_ID environment variable is not set");
			throw new ConvexError({
				code: WorkOSErrorCode.AUTHENTICATION_FAILED,
				message: ErrorMessage.UNKNOWN,
			});
		}

		// Authenticate with WorkOS
		const { data: authResponseData, error: authResponseError } = await tryCatch(
			authKit.workos.userManagement.authenticateWithPassword({
				clientId,
				email,
				password: args.password,
			}),
		);

		if (authResponseError) {
			throw new ConvexError({
				code: WorkOSErrorCode.AUTHENTICATION_FAILED,
				message: authResponseError.message,
			});
		}

		return {
			accessToken: authResponseData.accessToken,
			refreshToken: authResponseData.refreshToken,
			user: {
				object: "user" as const,
				id: authResponseData.user.id,
				email: authResponseData.user.email,
				emailVerified: authResponseData.user.emailVerified,
				profilePictureUrl: authResponseData.user.profilePictureUrl,
				firstName: authResponseData.user.firstName,
				lastName: authResponseData.user.lastName,
				lastSignInAt: authResponseData.user.lastSignInAt,
				createdAt: authResponseData.user.createdAt,
				updatedAt: authResponseData.user.updatedAt,
				externalId: authResponseData.user.externalId,
				metadata: authResponseData.user.metadata as Record<string, string>,
				locale: authResponseData.user.locale,
			},
		};
	},
});

/**
 * Request password reset email
 */
export const requestPasswordReset = action({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const email = args.email.toLowerCase().trim();

		// Rate limit
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "passwordReset", {
			key: email,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many password reset attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
			});
		}

		// Always return success to prevent email enumeration
		await tryCatch(
			authKit.workos.userManagement.createPasswordReset({ email }),
		);

		return { success: true };
	},
});

/**
 * Reset password with token
 */
export const resetPasswordWithToken = action({
	args: {
		token: v.string(),
		newPassword: v.string(),
	},
	handler: async (_ctx, args) => {
		const { error: resetPasswordError } = await tryCatch(
			authKit.workos.userManagement.resetPassword({
				token: args.token,
				newPassword: args.newPassword,
			}),
		);

		if (resetPasswordError) {
			throw new ConvexError({
				code: WorkOSErrorCode.RESET_PASSWORD_FAILED,
				message: resetPasswordError.message,
			});
		}

		return { success: true };
	},
});

/**
 * Get OAuth authorization URL
 */
export const getOAuthAuthorizationUrl = action({
	args: {
		provider: v.union(v.literal("GoogleOAuth"), v.literal("GitHubOAuth")),
		redirectUri: v.string(),
	},
	handler: async (_ctx, args) => {
		const clientId = process.env.WORKOS_CLIENT_ID;

		if (!clientId) {
			console.error("WORKOS_CLIENT_ID environment variable is not set");
			throw new ConvexError({
				code: WorkOSErrorCode.AUTHENTICATION_FAILED,
				message: ErrorMessage.UNKNOWN,
			});
		}

		const url = authKit.workos.userManagement.getAuthorizationUrl({
			clientId,
			provider: args.provider,
			redirectUri: args.redirectUri,
		});

		return { url };
	},
});
