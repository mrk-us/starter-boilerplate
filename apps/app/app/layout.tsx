import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "@repo/ui/globals.css";
import { cn } from "@repo/ui/lib/utils";
import { AuthProvider } from "@/features/auth/providers/auth";
import { SetupGuard } from "@/features/auth/providers/setup-guard";
import { DesktopClassSync } from "@/features/shared/components/desktop-class-sync";
import { ElectronWindow } from "@/features/shared/components/electron-window";
import { ConvexClientProvider } from "@/features/shared/providers/convex";
import { ThemeProvider } from "@/features/shared/providers/theme";
import { ConditionalUserMenu } from "@/features/user/components/conditional-user-menu";

const inter = localFont({
  src: "../fonts/InterVariable.woff2",
  variable: "--font-sans",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

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

export const metadata: Metadata = {
  description: APP_DESCRIPTION,
  title: APP_NAME,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn(
        "antialiased",
        "font-sans",
        inter.variable,
        geistMono.variable
      )}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static pre-hydration script, no user input
          dangerouslySetInnerHTML={{ __html: DESKTOP_ROOT_CLASS_SCRIPT }}
        />
        <DesktopClassSync />
        <ElectronWindow>
          <ConvexClientProvider>
            <ThemeProvider>
              <AuthProvider>
                <SetupGuard>
                  <ConditionalUserMenu />
                  {children}
                </SetupGuard>
              </AuthProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </ElectronWindow>
      </body>
    </html>
  );
}
