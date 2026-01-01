import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authKit } from "./auth/index";
import { resend } from "./emails/index";

const http = httpRouter();

authKit.registerRoutes(http);

http.route({
	path: "/resend-webhook",
	method: "POST",
	handler: httpAction(async (ctx, req) => {
		return await resend.handleResendEventWebhook(ctx, req);
	}),
});

export default http;
