import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { getConfig } from "@workos/authkit-session";
import { authkitMiddleware } from "@workos/authkit-tanstack-react-start";
import { OAUTH_ERROR_REDIRECT } from "@/features/auth/return-path";

// Registering our own request middleware opts the app out of the CSRF
// middleware Start applies by default, so it has to be added back explicitly.
// It must run before AuthKit so cross-site requests are rejected before any
// session work happens.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// AuthKit queues the session before onSuccess runs. Strip it from the final
// failure redirect after AuthKit has added its pending headers.
const discardFailedOAuthSession = createMiddleware().server(
  async ({ next }) => {
    const result = await next();
    const { response } = result;
    if (
      response.status !== 302 ||
      response.headers.get("Location") !== OAUTH_ERROR_REDIRECT
    ) {
      return result;
    }

    const sessionCookiePrefix = `${getConfig("cookieName")}=`;
    const headers = new Headers(response.headers);
    const cookies = headers.getSetCookie();
    headers.delete("Set-Cookie");
    for (const cookie of cookies) {
      if (!cookie.startsWith(sessionCookiePrefix)) {
        headers.append("Set-Cookie", cookie);
      }
    }

    return {
      ...result,
      response: new Response(response.body, {
        headers,
        status: response.status,
        statusText: response.statusText,
      }),
    };
  }
);

export const startInstance = createStart(() => ({
  requestMiddleware: [
    csrfMiddleware,
    discardFailedOAuthSession,
    authkitMiddleware(),
  ],
}));
