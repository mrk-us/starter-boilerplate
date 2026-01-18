import { registerRoutes } from "@convex-dev/stripe";
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { handleClerkWebhook } from "./auth/webhooks";
import { resend } from "./emails/index";

const http = httpRouter();

/**
 * Register Clerk webhook endpoint
 * Webhook endpoint: https://<your-convex-site>.convex.site/clerk/webhooks
 */
http.route({
	path: "/clerk/webhooks",
	method: "POST",
	handler: handleClerkWebhook,
});

/**
 * Register Resend webhook
 * Webhook endpoint: https://<your-convex-site>.convex.site/resend/webhooks
 */
http.route({
	path: "/resend/webhooks",
	method: "POST",
	handler: httpAction(
		async (ctx, req) => await resend.handleResendEventWebhook(ctx, req),
	),
});

/**
 * Register Stripe webhook routes
 * Webhook endpoint: https://<your-convex-site>.convex.site/stripe/webhook
 *
 * Required events in Stripe Dashboard:
 * - checkout.session.completed
 * - customer.created
 * - customer.updated
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.created
 * - invoice.finalized
 * - invoice.paid
 * - invoice.payment_failed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 */
registerRoutes(http, components.stripe, {
	webhookPath: "/stripe/webhooks",
	// Optional: Add custom event handlers
	events: {
		"customer.subscription.created": async (_ctx, event) => {
			console.log("Subscription created:", event.data.object.id);
		},
		"customer.subscription.updated": async (_ctx, event) => {
			const subscription = event.data.object;
			if (subscription.cancel_at_period_end) {
				console.log(
					"Subscription set to cancel:",
					subscription.id,
					"at",
					new Date(subscription.current_period_end * 1000).toISOString(),
				);
			}
		},
		"customer.subscription.deleted": async (_ctx, event) => {
			console.log("Subscription cancelled:", event.data.object.id);
		},
	},
	onEvent: async (_ctx, event) => {
		// Called for ALL events - useful for logging/analytics
		console.log("Stripe event received:", event.type);
	},
});

export default http;
