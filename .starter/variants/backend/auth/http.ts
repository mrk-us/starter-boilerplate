import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authKit } from "./auth/index";
import { resend } from "./emails/index";

const http = httpRouter();

/**
 * Register WorkOS webhook endpoint
 * Webhook endpoint: https://<your-convex-site>.convex.site/workos/webhook
 */
authKit.registerRoutes(http);

/**
 * Register Resend webhook
 * Webhook endpoint: https://<your-convex-site>.convex.site/resend/webhooks
 */
http.route({
  handler: httpAction(
    async (ctx, req) => await resend.handleResendEventWebhook(ctx, req)
  ),
  method: "POST",
  path: "/resend/webhooks",
});

export default http;
