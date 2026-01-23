import { registerRoutes } from "@convex-dev/stripe";
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { handleClerkEventWebhook } from "./auth/events";
import { onStripeEvent, stripeEventHandlers } from "./billing/events";
import { resend } from "./emails/index";

const http = httpRouter();

/**
 * Register Clerk webhook endpoint
 * Webhook endpoint: https://<your-convex-site>.convex.site/clerk/webhooks
 */
http.route({
	path: "/clerk/webhooks",
	method: "POST",
	handler: httpAction(
		async (ctx, req) => await handleClerkEventWebhook(ctx, req),
	),
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
 */
registerRoutes(http, components.stripe, {
	webhookPath: "/stripe/webhooks",
	events: stripeEventHandlers,
	onEvent: onStripeEvent,
});

export default http;
