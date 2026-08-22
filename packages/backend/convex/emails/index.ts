import { Resend } from "@convex-dev/resend";
import { components, internal } from "../_generated/api";

/**
 * Email client configuration
 *
 * Environment variables required:
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_WEBHOOK_SECRET: Your Resend webhook secret
 * - RESEND_FROM_EMAIL: Your Resend from email
 * - RESEND_TO_EMAIL: Your Resend to email
 */

/**
 * Initialize Resend component with event handler
 */
export const resend: Resend = new Resend(components.resend, {
	onEmailEvent: internal.emails.events.handleResendEventWebhook,
	testMode: false,
});
