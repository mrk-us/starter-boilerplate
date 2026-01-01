import { WorkOS } from "@workos-inc/node";
import { v } from "convex/values";
import type { Tag } from "resend";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { resend } from "./index";
import { sendResendEmail } from "./utils";

// Send a manual email using Resend SDK
export const sendManualEmail = internalAction({
	args: {
		from: v.optional(v.string()),
		to: v.optional(v.union(v.string(), v.array(v.string()))),
		subject: v.optional(v.string()),
		text: v.optional(v.string()),
		html: v.optional(v.string()),
		tags: v.optional(
			v.array(
				v.object({
					name: v.string(),
					value: v.string(),
				})
			)
		),
		template: v.optional(
			v.object({
				id: v.string(),
				variables: v.optional(v.record(v.string(), v.union(v.string(), v.number()))),
			})
		),
	},
	handler: async (ctx, args) => {
		const from = args.from ?? `${process.env.APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`;
		const to = args.to ?? "delivered@resend.dev";
		const subject = args.subject ?? "Test Email";
		const text = args.text;
		const html = args.html;

		if (!(args.template || html || text)) {
			throw new Error("Either template, html, or text must be provided");
		}

		const headers: Record<string, string> = {
			"Idempotency-Key": "", // Will be set in callback
		};
		const tags = (args.tags ?? []) as Tag[];

		const emailId = await resend.sendEmailManually(ctx, { from, to, subject }, async (emailId) => {
			headers["Idempotency-Key"] = emailId;
			return await sendResendEmail(from, to, subject, headers, tags, args.template, html, text);
		});
		return emailId;
	},
});

// Send an invitation email
export const sendInvitationEmail = internalAction({
	args: {
		invitationId: v.string(),
	},
	handler: async (ctx, args) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY);
		const invitation = await workos.userManagement.getInvitation(args.invitationId);

		if (!invitation) {
			throw new Error(`Invitation not found: ${args.invitationId}`);
		}

		await ctx.runMutation(internal.emails.mutations.sendInvitationEmail, {
			email: invitation.email,
			acceptInvitationUrl: invitation.acceptInvitationUrl,
			token: invitation.token,
			organizationId: invitation.organizationId ?? undefined,
			inviterUserId: invitation.inviterUserId ?? undefined,
		});
	},
});

// Send a password reset email
export const sendPasswordResetEmail = internalAction({
	args: {
		passwordResetId: v.string(),
	},
	handler: async (ctx, args) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY);
		const passwordReset = await workos.userManagement.getPasswordReset(args.passwordResetId);

		await ctx.runMutation(internal.emails.mutations.sendPasswordResetEmail, {
			email: passwordReset.email,
			passwordResetUrl: passwordReset.passwordResetUrl,
			passwordResetToken: passwordReset.passwordResetToken,
		});
	},
});

// Send a magic auth email
export const sendMagicAuthEmail = internalAction({
	args: {
		magicAuthId: v.string(),
	},
	handler: async (ctx, args) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY);
		const magicAuth = await workos.userManagement.getMagicAuth(args.magicAuthId);

		await ctx.runMutation(internal.emails.mutations.sendMagicAuthEmail, {
			email: magicAuth.email,
			code: magicAuth.code,
		});
	},
});

// Send an email verification email
export const sendEmailVerificationEmail = internalAction({
	args: {
		emailVerificationId: v.string(),
	},
	handler: async (ctx, args) => {
		const workos = new WorkOS(process.env.WORKOS_API_KEY);
		const emailVerification = await workos.userManagement.getEmailVerification(args.emailVerificationId);

		await ctx.runMutation(internal.emails.mutations.sendEmailVerificationEmail, {
			email: emailVerification.email,
			code: emailVerification.code,
		});
	},
});
