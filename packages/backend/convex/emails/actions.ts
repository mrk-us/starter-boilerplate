"use node";

import { render } from "@react-email/render";
import { APP_NAME, APP_URL } from "@repo/config";
import PasswordResetEmail from "@repo/email/emails/password-reset-email";
import VerifyEmailEmail from "@repo/email/emails/verify-email";
import WelcomeEmail from "@repo/email/emails/welcome-email";
import WelcomeToProEmail from "@repo/email/emails/welcome-to-pro-email";
import { tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { authKit } from "../auth";
import { rateLimiter } from "../rateLimiter";
import { resend } from "./index";

/**
 * Send email verification email (triggered by webhook)
 */
export const sendEmailVerificationEmail = internalAction({
	args: {
		emailVerificationId: v.string(),
	},
	handler: async (ctx, args) => {
		// Rate limit
		const { ok } = await rateLimiter.limit(ctx, "resendEmailVerification", {
			key: args.emailVerificationId,
		});

		if (!ok) {
			console.warn(
				"Rate limited: sendEmailVerificationEmail",
				args.emailVerificationId,
			);
			return;
		}

		// Validate input
		if (!args.emailVerificationId) {
			console.warn("Invalid emailVerificationId:", args.emailVerificationId);
			return;
		}

		// Fetch email verification from WorkOS
		const { data: emailVerificationData, error: emailVerificationError } =
			await tryCatch(
				authKit.workos.userManagement.getEmailVerification(
					args.emailVerificationId,
				),
			);

		if (emailVerificationError) {
			console.error(
				"Failed to get email verification:",
				emailVerificationError.message,
			);
			return;
		}

		if (!emailVerificationData) {
			console.warn("Email verification not found:", args.emailVerificationId);
			return;
		}

		// Build verification URL
		const verificationUrl = `${APP_URL}/verify-email?authId=${emailVerificationData.userId}`;

		// Send email
		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: emailVerificationData.email,
				subject: "Verify your email",
				html: await render(
					VerifyEmailEmail({
						code: emailVerificationData.code,
						url: verificationUrl,
					}),
				),
				headers: [{ name: "X-Email-Category", value: "email_verification" }],
			}),
		);

		if (sendEmailError) {
			console.error(
				"Failed to send verification email:",
				sendEmailError.message,
			);
		}
	},
});

/**
 * Send password reset email (triggered by webhook)
 */
export const sendPasswordResetEmail = internalAction({
	args: {
		passwordResetId: v.string(),
	},
	handler: async (ctx, args) => {
		// Rate limit
		const { ok } = await rateLimiter.limit(ctx, "passwordReset", {
			key: args.passwordResetId,
		});

		if (!ok) {
			console.warn(
				"Rate limited: sendPasswordResetEmail",
				args.passwordResetId,
			);
			return;
		}

		if (!args.passwordResetId) {
			// Validate input
			console.warn("Invalid passwordResetId:", args.passwordResetId);
			return;
		}

		// Fetch password reset from WorkOS
		const { data: passwordResetData, error: passwordResetError } =
			await tryCatch(
				authKit.workos.userManagement.getPasswordReset(args.passwordResetId),
			);

		if (passwordResetError) {
			console.error(
				"Failed to get password reset:",
				passwordResetError.message,
			);
			return;
		}

		if (!passwordResetData) {
			console.warn("Password reset not found:", args.passwordResetId);
			return;
		}

		// Build reset URL
		const resetUrl = `${process.env.APP_URL}/reset-password?token=${passwordResetData.passwordResetToken}`;

		// Send email
		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: passwordResetData.email,
				subject: "Reset your password",
				html: await render(PasswordResetEmail({ url: resetUrl })),
				headers: [{ name: "X-Email-Category", value: "password_reset" }],
			}),
		);

		if (sendEmailError) {
			console.error(
				"Failed to send password reset email:",
				sendEmailError.message,
			);
		}
	},
});

/**
 * Send welcome email (internal action)
 */
export const sendWelcomeEmail = internalAction({
	args: {
		email: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		// Validate input
		if (!args.email || !args.name) {
			console.warn("Invalid welcome email params:", {
				email: args.email,
				name: args.name,
			});
			return;
		}

		// Send email
		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: args.email,
				subject: `Welcome to ${APP_NAME}`,
				html: await render(WelcomeEmail({ name: args.name })),
			}),
		);

		if (sendEmailError) {
			console.error("Failed to send welcome email:", sendEmailError.message);
		}
	},
});

/**
 * Send welcome to Pro email (triggered when user subscribes to Pro plan)
 */
export const sendWelcomeToProEmail = internalAction({
	args: {
		email: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		// Validate input
		if (!args.email || !args.name) {
			console.warn("Invalid welcome to pro email params:", {
				email: args.email,
				name: args.name,
			});
			return;
		}

		// Send email
		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: args.email,
				subject: `Welcome to ${APP_NAME} Pro!`,
				html: await render(
					WelcomeToProEmail({
						name: args.name,
					}),
				),
				headers: [{ name: "X-Email-Category", value: "welcome_to_pro" }],
			}),
		);

		if (sendEmailError) {
			console.error(
				"Failed to send welcome to pro email:",
				sendEmailError.message,
			);
		}
	},
});
