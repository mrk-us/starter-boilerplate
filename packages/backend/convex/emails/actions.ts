"use node";

import { render } from "@react-email/render";
import { APP_NAME } from "@repo/config";
import PasswordResetEmail from "@repo/email/emails/password-reset-email";
import VerifyEmailEmail from "@repo/email/emails/verify-email";
import WelcomeEmail from "@repo/email/emails/welcome-email";
import WelcomeToProEmail from "@repo/email/emails/welcome-to-pro-email";
import { tryCatch } from "@repo/shared";
import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { rateLimiter } from "../rateLimiter";
import { resend } from "./index";

/**
 * Send the sign-up verification code (triggered by the Clerk `email.created`
 * webhook when custom email delivery is enabled)
 */
export const sendEmailVerificationEmail = internalAction({
  args: {
    code: v.string(),
    email: v.string(),
    emailId: v.string(),
  },
  handler: async (ctx, args) => {
    const { ok } = await rateLimiter.limit(ctx, "verificationEmailDelivery", {
      key: args.emailId,
    });

    if (!ok) {
      console.warn(
        "[clerk] Verification email already delivered:",
        args.emailId
      );
      return;
    }

    const { error: sendEmailError } = await tryCatch(
      resend.sendEmail(ctx, {
        from: `${APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
        headers: [{ name: "X-Email-Category", value: "email_verification" }],
        html: await render(VerifyEmailEmail({ code: args.code })),
        subject: "Verify your email",
        to: args.email,
      })
    );

    if (sendEmailError) {
      console.error(
        "Failed to send verification email:",
        sendEmailError.message
      );
    }
  },
});

/**
 * Send the password reset code (triggered by the Clerk `email.created` webhook
 * when custom email delivery is enabled)
 */
export const sendPasswordResetEmail = internalAction({
  args: {
    code: v.string(),
    email: v.string(),
    emailId: v.string(),
  },
  handler: async (ctx, args) => {
    const { ok } = await rateLimiter.limit(ctx, "passwordResetEmailDelivery", {
      key: args.emailId,
    });

    if (!ok) {
      console.warn(
        "[clerk] Password reset email already delivered:",
        args.emailId
      );
      return;
    }

    const { error: sendEmailError } = await tryCatch(
      resend.sendEmail(ctx, {
        from: `${APP_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
        headers: [{ name: "X-Email-Category", value: "password_reset" }],
        html: await render(PasswordResetEmail({ code: args.code })),
        subject: "Reset your password",
        to: args.email,
      })
    );

    if (sendEmailError) {
      console.error(
        "Failed to send password reset email:",
        sendEmailError.message
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
    if (!(args.email && args.name)) {
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
        html: await render(WelcomeEmail({ name: args.name })),
        subject: `Welcome to ${APP_NAME}`,
        to: args.email,
      })
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
    if (!(args.email && args.name)) {
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
        headers: [{ name: "X-Email-Category", value: "welcome_to_pro" }],
        html: await render(
          WelcomeToProEmail({
            name: args.name,
          })
        ),
        subject: `Welcome to ${APP_NAME} Pro!`,
        to: args.email,
      })
    );

    if (sendEmailError) {
      console.error(
        "Failed to send welcome to pro email:",
        sendEmailError.message
      );
    }
  },
});
