import type { ConvexQueryClient } from "@convex-dev/react-query";
import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { getAuth } from "@workos/authkit-tanstack-react-start";
import type { ConvexReactClient } from "convex/react";
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

export const Route = createRootRouteWithContext<{
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  queryClient: QueryClient;
}>()({
  beforeLoad: async ({ context }) => {
    const auth = await getAuth();

    // `serverHttpClient` only exists during SSR; handing it the access token is
    // what lets Convex queries resolve on the server instead of falling back to
    // an unauthenticated read.
    if (auth.user) {
      context.convexQueryClient.serverHttpClient?.setAuth(auth.accessToken);
    }

    // Deliberately only the user: `beforeLoad` return values are dehydrated
    // into the SSR payload, so the access token must not travel with it.
    return { user: auth.user };
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
        <ElectronWindow>
          <ThemeProvider>
            <Outlet />
          </ThemeProvider>
        </ElectronWindow>
        <Scripts />
      </body>
    </html>
  );
}
