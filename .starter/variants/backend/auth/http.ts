import { httpRouter } from "convex/server";
import { authKit } from "./auth/index";
import { handleResendWebhook } from "./emails/index";

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
  handler: handleResendWebhook,
  method: "POST",
  path: "/resend/webhooks",
});

export default http;
