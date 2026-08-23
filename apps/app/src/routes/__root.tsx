import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { DesktopClassSync, ElectronWindow } from "@/features/shared/components";
import { ThemeProvider } from "@/features/shared/providers/theme";
import appCssUrl from "@/styles/app.css?url";

/**
 * The Electron preload has already exposed `window.desktop` by the time any
 * page script runs, so tagging the root element here — before React renders —
 * means desktop styling is applied on the first paint, with no flash and no
 * hydration mismatch (`<html>` is marked `suppressHydrationWarning`).
 *
 * The overlay state is read here too, not just in `DesktopClassSync`: settling
 * it in an effect would let the first paint reserve the wrong titlebar inset.
 */
const DESKTOP_ROOT_CLASS_SCRIPT = `(function(){var d=window.desktop;if(!d)return;var c=document.documentElement.classList;c.add("electron","electron-"+d.platform);var o=navigator.windowControlsOverlay;if(o&&o.visible)c.add("wco");})();`;

/**
 * Clerk's session lives in an httpOnly cookie, so the signed-in state is only
 * readable on the server. Every navigation re-runs `beforeLoad`, which keeps
 * the route guards in step with the session.
 */
const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { getToken, userId } = await auth();

  return { token: await getToken(), userId };
});

export const Route = createRootRouteWithContext<{
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  queryClient: QueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const { token, userId } = await fetchClerkAuth();

    // `serverHttpClient` only exists during SSR; handing it the session token
    // is what lets Convex queries resolve on the server instead of falling back
    // to an unauthenticated read.
    if (token) {
      context.convexQueryClient.serverHttpClient?.setAuth(token);
    }

    // Deliberately only the user id: `beforeLoad` return values are dehydrated
    // into the SSR payload, so the token must not travel with it.
    return { userId };
  },
  component: RootComponent,
  head: () => ({
    links: [
      { href: appCssUrl, rel: "stylesheet" },
      { href: "/favicon.ico", rel: "icon" },
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
      { title: APP_NAME },
      { content: APP_DESCRIPTION, name: "description" },
    ],
  }),
});

function RootComponent() {
  const { convexClient } = useRouteContext({ from: Route.id });

  return (
    <html className="font-sans antialiased" lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static pre-hydration script, no user input
          dangerouslySetInnerHTML={{ __html: DESKTOP_ROOT_CLASS_SCRIPT }}
        />
        <DesktopClassSync />
        {/* Inside `<body>`: `ClerkProvider` emits a script tag alongside its
            children, which the browser would otherwise hoist out of `<html>`. */}
        <ClerkProvider>
          <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
            <ElectronWindow>
              <ThemeProvider>
                <Outlet />
              </ThemeProvider>
            </ElectronWindow>
          </ConvexProviderWithClerk>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}
