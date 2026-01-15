import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { handleClerkWebhook } from "./auth/webhooks";
import { polar } from "./billing/index";
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
 * Register Polar webhook routes
 * Webhook endpoint: https://<your-convex-site>.convex.site/polar/events
 */
polar.registerRoutes(http, {
	// Custom callbacks for webhook events (optional)
	onSubscriptionCreated: async (_ctx, event) => {
		console.log("Subscription created:", event.data.id);
	},
	onSubscriptionUpdated: async (_ctx, event) => {
		// Handle subscription updates like cancellations
		if (event.data.canceledAt) {
			console.log(
				"Subscription cancelled:",
				event.data.id,
				"Reason:",
				event.data.customerCancellationReason,
			);
		}
	},
	onProductCreated: async (_ctx, event) => {
		console.log("Product created:", event.data.id, event.data.name);
	},
	onProductUpdated: async (_ctx, event) => {
		console.log("Product updated:", event.data.id, event.data.name);
	},
});

export default http;
