import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";
import { components, internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

// Initialize Resend component with event handler
export const resend: Resend = new Resend(components.resend, {
	onEmailEvent: internal.emails.index.handleEmailEvent,
	testMode: false,
});

// Handle Resend webhook events
export const handleEmailEvent = internalMutation({
	args: vOnEmailEventArgs,
	handler: (_ctx, args) => {
		if (args.event.type === "email.failed") {
			const eventData = args.event.data as { failed?: { reason?: string } };
			console.error("Email failed:", {
				emailId: args.id,
				reason: eventData.failed?.reason ?? "Unknown",
				to: args.event.data.to,
				subject: args.event.data.subject,
			});
			// TODO: Optionally update database, notify admins, etc.
		}

		if (args.event.type === "email.bounced") {
			console.warn("Email bounced:", {
				emailId: args.id,
				to: args.event.data.to,
				subject: args.event.data.subject,
			});
			// TODO: Mark user email as invalid, update database, etc.
		}

		if (args.event.type === "email.complained") {
			console.warn("Email marked as spam:", {
				emailId: args.id,
				to: args.event.data.to,
				subject: args.event.data.subject,
			});
			// TODO: Handle spam complaints - important for sender reputation
		}

		if (args.event.type === "email.delivered") {
			// Optionally log successful deliveries for analytics
			// console.log("Email delivered:", args.id);
		}
	},
});
