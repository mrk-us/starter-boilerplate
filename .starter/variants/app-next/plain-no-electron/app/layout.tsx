import { APP_DESCRIPTION, APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "@repo/ui/globals.css";
import { cn } from "@repo/ui/lib/utils";
import { ThemeProvider } from "@/features/shared/providers/theme";

const inter = localFont({
  src: "../fonts/InterVariable.woff2",
  variable: "--font-sans",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
