import { Resend } from "@convex-dev/resend";
import { components, internal } from "../_generated/api";

/**
 * Initialize Resend component with event handler
 */
export const resend: Resend = new Resend(components.resend, {
	onEmailEvent: internal.emails.events.handleEmailEvent,
	testMode: false,
});
