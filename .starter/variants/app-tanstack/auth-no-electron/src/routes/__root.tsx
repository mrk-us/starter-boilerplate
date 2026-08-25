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
import { ThemeProvider } from "@/features/shared/providers/theme";
import appCssUrl from "@/styles/app.css?url";

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
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
