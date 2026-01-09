import { ConvexError, v } from "convex/values";
import { isDisposableEmail } from "disposable-email-domains-js";
import type { ActionCtx } from "../_generated/server";
import { action, internalAction } from "../_generated/server";
import { rateLimiter } from "../rateLimiter";
import { AuthErrorCode } from "./constants";
import { authKit } from "./index";
import type { AuthenticateResult } from "./types";
import { getWorkOSErrorMessage } from "./utils";

/**
 * AuthKit action handler
 * (required by WorkOS AuthKit component)
 */
export const { authKitAction } = authKit.actions({
	userRegistration: async (_ctx, _action, response) => response.allow(),
	authentication: async (_ctx, _action, response) => response.allow(),
});

/**
 * Create user account
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
		try {
			const user = await authKit.workos.userManagement.createUser({
				email,
				password: args.password,
			});

			// Send verification email
			if (!user.emailVerified) {
				await authKit.workos.userManagement.sendVerificationEmail({
					userId: user.id,
				});
			}

			return {
				id: user.id,
				emailVerified: user.emailVerified,
			};
		} catch (error: unknown) {
			const message = getWorkOSErrorMessage(error);

			if (message) {
				throw new ConvexError({
					code: AuthErrorCode.WORKOS_ERROR,
					message,
				});
			}

			throw new ConvexError({
				code: AuthErrorCode.UNKNOWN,
				message: "Something went wrong. Please try again.",
			});
		}
	},
});

/**
 * Verify email
 */
export const verifyEmail = action({
	args: {
		authId: v.string(),
		code: v.string(),
	},
	handler: async (_ctx, args) => {
		const { authId, code } = args;

		try {
			await authKit.workos.userManagement.verifyEmail({
				userId: authId,
				code,
			});

			return { success: true };
		} catch (error: unknown) {
			const message = getWorkOSErrorMessage(error);

			if (message) {
				throw new ConvexError({
					code: AuthErrorCode.WORKOS_ERROR,
					message,
				});
			}

			return { success: false, error: message };
		}
	},
});

/**
 * Shared verification email logic
 */
async function sendVerificationEmail(ctx: ActionCtx, authId: string) {
	const authUser = await authKit.getAuthUser(ctx);

	// Check if user is authorized
	if (authUser && authUser.id !== authId) {
		throw new ConvexError({
			code: AuthErrorCode.UNAUTHORIZED,
			message: "You can only resend a verification email for your own account.",
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
	await authKit.workos.userManagement.sendVerificationEmail({
		userId: authId,
	});
}

/**
 * Resend verification email
 */
export const resendVerificationEmail = action({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			await sendVerificationEmail(ctx, args.authId);
			return { success: true };
		} catch (error: unknown) {
			const message = getWorkOSErrorMessage(error);

			if (message) {
				throw new ConvexError({
					code: AuthErrorCode.WORKOS_ERROR,
					message,
				});
			}

			return { success: false, error: message };
		}
	},
});

/**
 * Resend verification email on email address change
 */
export const resendVerificationEmailOnEmailChange = internalAction({
	args: {
		authId: v.string(),
	},
	handler: async (ctx, args) => {
		try {
			await sendVerificationEmail(ctx, args.authId);
			return { success: true };
		} catch (error: unknown) {
			const message = getWorkOSErrorMessage(error);

			if (message) {
				throw new ConvexError({
					code: AuthErrorCode.WORKOS_ERROR,
					message,
				});
			}

			return { success: false, error: message };
		}
	},
});

/**
 * Authenticate with password
 */
export const authenticateWithPassword = action({
	args: {
		email: v.string(),
		password: v.string(),
	},
	handler: async (ctx, args): Promise<AuthenticateResult> => {
		const email = args.email.toLowerCase().trim();

		// Rate limit by email
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "signIn", {
			key: email,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} ${(Math.ceil(retryAfter / 60_000)) === 1 ? "minute" : "minutes"}.`,
			});
		}

		const clientId = process.env.WORKOS_CLIENT_ID;
		if (!clientId) {
			throw new ConvexError({
				code: AuthErrorCode.UNKNOWN,
				message: "Server configuration error",
			});
		}

		try {
			const response =
				await authKit.workos.userManagement.authenticateWithPassword({
					clientId,
					email,
					password: args.password,
				});

			// Return full user object for session compatibility
			return {
				accessToken: response.accessToken,
				refreshToken: response.refreshToken,
				user: {
					object: "user" as const,
					id: response.user.id,
					email: response.user.email,
					emailVerified: response.user.emailVerified,
					profilePictureUrl: response.user.profilePictureUrl,
					firstName: response.user.firstName,
					lastName: response.user.lastName,
					lastSignInAt: response.user.lastSignInAt,
					createdAt: response.user.createdAt,
					updatedAt: response.user.updatedAt,
					externalId: response.user.externalId,
					metadata: response.user.metadata as Record<string, string>,
					locale: response.user.locale,
				},
			};
		} catch (error: unknown) {
			const message = getWorkOSErrorMessage(error);
			if (message) {
				throw new ConvexError({
					code: AuthErrorCode.WORKOS_ERROR,
					message,
				});
			}

			throw new ConvexError({
				code: AuthErrorCode.UNKNOWN,
				message: "An error occurred. Please try again.",
			});
		}
	},
});

/**
 * Request password reset
 */
export const requestPasswordReset = action({
	args: {
		email: v.string(),
	},
	handler: async (ctx, args) => {
		const email = args.email.toLowerCase().trim();

		// Rate limit by email
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "passwordReset", {
			key: email,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many password reset attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
			});
		}

		try {
			await authKit.workos.userManagement.createPasswordReset({
				email,
			});

			// Return success for security
			return { success: true };
		} catch {
			// Return success for security
			return { success: true };
		}
	},
});

/**
 * Reset password with token action
 */
export const resetPasswordWithToken = action({
	args: {
		token: v.string(),
		newPassword: v.string(),
	},
	handler: async (_ctx, args) => {
		try {
			await authKit.workos.userManagement.resetPassword({
				token: args.token,
				newPassword: args.newPassword,
			});

			return { success: true };
		} catch (error: unknown) {
			const message = getWorkOSErrorMessage(error);
			if (message) {
				throw new ConvexError({
					code: AuthErrorCode.WORKOS_ERROR,
					message,
				});
			}

			throw new ConvexError({
				code: AuthErrorCode.UNKNOWN,
				message: "An error occurred. Please try again.",
			});
		}
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
			throw new ConvexError({
				code: AuthErrorCode.UNKNOWN,
				message: "Server configuration error",
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
