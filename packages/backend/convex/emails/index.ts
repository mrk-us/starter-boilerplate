import { Resend } from "@convex-dev/resend";
import { components, internal } from "../_generated/api";
import { httpAction } from "../_generated/server";

/**
 * Email client configuration
 *
 * Environment variables required:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_WEBHOOK_SECRET: Your Resend webhook secret
 * - RESEND_FROM_EMAIL: Your Resend from email
 */

/**
 * Initialize Resend component with event handler
 */
export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.emails.events.handleResendEventWebhook,
  testMode: false,
});

/**
 * Resend webhook endpoint. A bad signature is the sender's error, so it returns
 * 400. Other failures still return 500, so Resend retries the delivery.
 */
export const handleResendWebhook = httpAction(async (ctx, req) => {
  try {
    return await resend.handleResendEventWebhook(ctx, req);
  } catch (error) {
    if (error instanceof Error && error.name === "WebhookVerificationError") {
      return new Response("Invalid webhook signature", { status: 400 });
    }
    throw error;
  }
});
