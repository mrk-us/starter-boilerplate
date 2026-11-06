"use client";

import "@repo/ui/globals.css";
import ErrorPage from "./error";

/** Replaces the root layout when the layout itself fails to render. */
export default function GlobalError() {
  return (
    <html lang="en">
      {/* The app font comes from the root layout, which this page replaces */}
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <ErrorPage />
      </body>
    </html>
  );
}
