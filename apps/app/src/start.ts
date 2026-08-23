import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

// Registering our own request middleware opts the app out of the CSRF
// middleware Start applies by default, so it has to be added back explicitly.
// It must run before Clerk so cross-site requests are rejected before any
// session work happens.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, clerkMiddleware()],
}));
