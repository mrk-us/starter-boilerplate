"use node";

import { render } from "@react-email/render";
import { APP_NAME, APP_URL } from "@repo/config";
import PasswordResetEmail from "@repo/email/emails/password-reset-email";
import VerifyEmailEmail from "@repo/email/emails/verify-email";
import WelcomeEmail from "@repo/email/emails/welcome-email";
import { tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { resend } from "./index";

/**
 * Send email verification email (triggered by Clerk webhook)
 */
export const sendEmailVerificationEmail = internalAction({
	args: {
		email: v.string(),
		code: v.string(),
	},
	handler: async (ctx, args) => {
		// Validate input
		if (!args.email || !args.code) {
			console.warn("Invalid verification email params:", {
				email: args.email,
				code: args.code,
			});
			return;
		}

		// Build verification URL
		const verificationUrl = `${APP_URL}/verify-email`;

		// Send email
		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: args.email,
				subject: "Verify your email",
				html: await render(
					VerifyEmailEmail({
						code: args.code,
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
 * Send password reset email (triggered by Clerk webhook)
 */
export const sendPasswordResetEmail = internalAction({
	args: {
		email: v.string(),
		code: v.string(),
	},
	handler: async (ctx, args) => {
		// Validate input
		if (!args.email || !args.code) {
			console.warn("Invalid password reset email params:", {
				email: args.email,
				code: args.code,
			});
			return;
		}

		// Build reset URL
		const resetUrl = `${APP_URL}/reset-password`;

		// Send email with the code displayed
		const { error: sendEmailError } = await tryCatch(
			resend.sendEmail(ctx, {
				from: `${APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
				to: args.email,
				subject: "Reset your password",
				html: await render(
					PasswordResetEmail({ code: args.code, url: resetUrl }),
				),
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
