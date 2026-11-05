import { createFileRoute } from "@tanstack/react-router";
import { handleOAuthCallback } from "@/features/auth/server/callback";

export const Route = createFileRoute("/callback")({
  server: {
    handlers: {
      GET: handleOAuthCallback,
    },
  },
});
