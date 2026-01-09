"use node";

import { render } from "@react-email/render";
import PasswordResetEmail from "@repo/email/emails/password-reset-email";
import VerifyEmailEmail from "@repo/email/emails/verify-email";
import WelcomeEmail from "@repo/email/emails/welcome-email";
import { ConvexError, v } from "convex/values";
import { internalAction } from "../_generated/server";
import { authKit } from "../auth";
import { AuthErrorCode } from "../auth/constants";
import { rateLimiter } from "../rateLimiter";
import { resend } from "./index";

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = internalAction({
	args: {
		passwordResetId: v.string(),
	},
	handler: async (ctx, args) => {
		// Rate limit by password reset id
		const { ok, retryAfter } = await rateLimiter.limit(ctx, "passwordReset", {
			key: args.passwordResetId,
		});

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
			});
		}

		try {
			// Validate ID format
			if (!args.passwordResetId || typeof args.passwordResetId !== "string") {
				console.warn(`Invalid passwordResetId: ${args.passwordResetId}`);
				return;
			}

			const passwordReset =
				await authKit.workos.userManagement.getPasswordReset(
					args.passwordResetId,
				);

			if (!passwordReset) {
				console.warn(`Password reset not found: ${args.passwordResetId}`);
				return;
			}

			const resetUrl = `${process.env.APP_URL}/reset-password?token=${passwordReset.passwordResetToken}`;

			console.log("Sending password reset email to:", passwordReset.email);

			await resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: passwordReset.email,
				subject: "Reset your password",
				html: await render(PasswordResetEmail({ resetUrl })),
				headers: [{ name: "X-Email-Category", value: "password_reset" }],
			});
		} catch (error: unknown) {
			console.warn("Error in sendPasswordResetEmail action:", {
				passwordResetId: args.passwordResetId,
				error: error,
			});

			throw error;
		}
	},
});

/**
 * Send an email verification email
 */
export const sendEmailVerificationEmail = internalAction({
	args: {
		emailVerificationId: v.string(),
	},
	handler: async (ctx, args) => {
		// Rate limit by email verification id
		const { ok, retryAfter } = await rateLimiter.limit(
			ctx,
			"resendEmailVerification",
			{
				key: args.emailVerificationId,
			},
		);

		if (!ok) {
			throw new ConvexError({
				code: AuthErrorCode.RATE_LIMITED,
				message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
			});
		}

		try {
			if (
				!args.emailVerificationId ||
				typeof args.emailVerificationId !== "string"
			) {
				console.warn(
					`Invalid emailVerificationId: ${args.emailVerificationId}`,
				);
				return;
			}

			const emailVerification =
				await authKit.workos.userManagement.getEmailVerification(
					args.emailVerificationId,
				);

			if (!emailVerification) {
				console.warn(
					`Email verification not found: ${args.emailVerificationId}`,
				);
				return;
			}

			console.log(
				"Sending email verification email to:",
				emailVerification.email,
			);

			await resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: emailVerification.email,
				subject: `Verify your email`,
				html: await render(
					VerifyEmailEmail({
						code: emailVerification.code,
						authId: emailVerification.userId,
					}),
				),
				headers: [{ name: "X-Email-Category", value: "email_verification" }],
			});
		} catch (error: unknown) {
			console.warn("Error in sendEmailVerificationEmail action:", {
				emailVerificationId: args.emailVerificationId,
				error: error,
			});

			throw error;
		}
	},
});

/**
 * Send a welcome email
 */
export const sendWelcomeEmail = internalAction({
	args: {
		email: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		if (!args.email || !args.name) {
			console.error("Invalid email or name");
			return;
		}

		console.log("Sending welcome email to:", args.email);

		try {
			await resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: args.email,
				subject: `Welcome to ${process.env.APP_NAME}`,
				html: await render(WelcomeEmail({ name: args.name })),
			});
		} catch (error: unknown) {
			console.error("Error in sendWelcomeEmail action:", {
				email: args.email,
				name: args.name,
				error: error instanceof Error ? error.message : String(error),
			});

			throw error;
		}
	},
});
