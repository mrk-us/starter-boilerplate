"use node";

import { render } from "@react-email/render";
import PasswordResetEmail from "@repo/email/emails/password-reset-email";
import VerifyEmailEmail from "@repo/email/emails/verify-email";
import WelcomeEmail from "@repo/email/emails/welcome-email";
import { tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { authKit } from "../auth";
import { rateLimiter } from "../rateLimiter";
import { resend } from "./index";

/**
 * Send password reset email (internal action triggered by webhook)
 */
export const sendPasswordResetEmail = internalAction({
	args: {
		passwordResetId: v.string(),
	},
	handler: async (ctx, args) => {
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
			console.warn("Invalid passwordResetId:", args.passwordResetId);
			return;
		}

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

		const resetUrl = `${process.env.APP_URL}/reset-password?token=${passwordResetData.passwordResetToken}`;

		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: passwordResetData.email,
				subject: "Reset your password",
				html: await render(PasswordResetEmail({ resetUrl })),
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
 * Send email verification email (internal action triggered by webhook)
 */
export const sendEmailVerificationEmail = internalAction({
	args: {
		emailVerificationId: v.string(),
	},
	handler: async (ctx, args) => {
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

		if (!args.emailVerificationId) {
			console.warn("Invalid emailVerificationId:", args.emailVerificationId);
			return;
		}

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

		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: emailVerificationData.email,
				subject: "Verify your email",
				html: await render(
					VerifyEmailEmail({
						code: emailVerificationData.code,
						authId: emailVerificationData.userId,
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
 * Send welcome email (internal action)
 */
export const sendWelcomeEmail = internalAction({
	args: {
		email: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		if (!args.email || !args.name) {
			console.warn("Invalid welcome email params:", {
				email: args.email,
				name: args.name,
			});
			return;
		}

		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: args.email,
				subject: `Welcome to ${process.env.APP_NAME}`,
				html: await render(WelcomeEmail({ name: args.name })),
			}),
		);

		if (sendEmailError) {
			console.error("Failed to send welcome email:", sendEmailError.message);
		}
	},
});
