import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authKit } from "./auth/index";
import { polar } from "./billing/index";
import { resend } from "./emails/index";

const http = httpRouter();

////////////////////////////////////////////////////////////
// Register AuthKit routes
////////////////////////////////////////////////////////////
authKit.registerRoutes(http);

////////////////////////////////////////////////////////////
// Register Polar webhook routes
// Webhook endpoint: https://<your-convex-site>.convex.site/polar/events
////////////////////////////////////////////////////////////
// eslint-disable-next-line @typescript-eslint/no-explicit-any
polar.registerRoutes(http as any, {
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

////////////////////////////////////////////////////////////
// Register Resend webhook
////////////////////////////////////////////////////////////
http.route({
	path: "/resend-webhook",
	method: "POST",
	handler: httpAction(
		async (ctx, req) => await resend.handleResendEventWebhook(ctx, req),
	),
});

export default http;
