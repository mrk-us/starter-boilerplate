import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordForm,
  head: () => ({ meta: [{ title: `Set a new password | ${APP_NAME}` }] }),
  validateSearch: z.object({
    // Single-use token from the reset email.
    token: z.string().optional(),
  }),
});
