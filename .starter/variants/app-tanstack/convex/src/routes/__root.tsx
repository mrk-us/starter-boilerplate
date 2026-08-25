import type { ConvexQueryClient } from "@convex-dev/react-query";
import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ConvexReactClient } from "convex/react";
import { DesktopClassSync } from "@/features/shared/components/desktop-class-sync";
import { ElectronWindow } from "@/features/shared/components/electron-window";
import { ThemeProvider } from "@/features/shared/providers/theme";
import appCssUrl from "@/styles/app.css?url";

const DESKTOP_ROOT_CLASS_SCRIPT = `(function(){var d=window.desktop;if(!d)return;var c=document.documentElement.classList;c.add("electron","electron-"+d.platform);var o=navigator.windowControlsOverlay;if(o&&o.visible)c.add("wco");})();`;

export const Route = createRootRouteWithContext<{
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
  queryClient: QueryClient;
}>()({
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
