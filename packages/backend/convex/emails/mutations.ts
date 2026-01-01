import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { resend } from "./index";

// Send an invitation email mutation
export const sendInvitationEmail = internalMutation({
	args: {
		email: v.string(),
		acceptInvitationUrl: v.string(),
		token: v.string(),
		organizationId: v.optional(v.string()),
		inviterUserId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await resend.sendEmail(ctx, {
			from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
			to: args.email,
			subject: `You've been invited to ${process.env.APP_NAME}`,
			html: `
				<h1>You've been invited!</h1>
				<p>Click the link below to accept your invitation:</p>
				<a href="${args.acceptInvitationUrl}">Accept Invitation</a>
				<p>Or use this token: ${args.token}</p>
			`,
			headers: [
				{ name: "X-Email-Category", value: "invitation" },
				...(args.organizationId ? [{ name: "X-Organization-Id", value: args.organizationId }] : []),
			],
		});
	},
});

// Password reset email mutation
export const sendPasswordResetEmail = internalMutation({
	args: {
		email: v.string(),
		passwordResetUrl: v.string(),
		passwordResetToken: v.string(),
	},
	handler: async (ctx, args) => {
		await resend.sendEmail(ctx, {
			from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
			to: args.email,
			subject: `Reset your password for ${process.env.APP_NAME}`,
			html: `
				<h1>Reset your password</h1>
				<p>Click the link below to reset your password:</p>
				<a href="${args.passwordResetUrl}">Reset Password</a>
				<p>Or use this token: ${args.passwordResetToken}</p>
			`,
			headers: [{ name: "X-Email-Category", value: "password_reset" }],
		});
	},
});

// Magic auth email mutation
export const sendMagicAuthEmail = internalMutation({
	args: {
		email: v.string(),
		code: v.string(),
	},
	handler: async (ctx, args) => {
		await resend.sendEmail(ctx, {
			from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
			to: args.email,
			subject: `Your ${process.env.APP_NAME} sign-in code`,
			html: `
				<h1>Your Magic Auth code</h1>
				<p>Use this code to sign in:</p>
				<h2>${args.code}</h2>
				<p>This code will expire in a few minutes.</p>
			`,
			headers: [{ name: "X-Email-Category", value: "magic_auth" }],
		});
	},
});

// Email verification email mutation
export const sendEmailVerificationEmail = internalMutation({
	args: {
		email: v.string(),
		code: v.string(),
	},
	handler: async (ctx, args) => {
		await resend.sendEmail(ctx, {
			from: `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
			to: args.email,
			subject: `Verify your email for ${process.env.APP_NAME}`,
			html: `
				<h1>Verify your email</h1>
				<p>Use this code to verify your email address:</p>
				<h2>${args.code}</h2>
				<p>This code will expire in a few minutes.</p>
			`,
			headers: [{ name: "X-Email-Category", value: "email_verification" }],
		});
	},
});
