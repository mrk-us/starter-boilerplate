import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authKit } from "./auth/index";
import { resend } from "./emails/index";

const http = httpRouter();

////////////////////////////////////////////////////////////
// Register AuthKit routes
////////////////////////////////////////////////////////////
authKit.registerRoutes(http);

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
