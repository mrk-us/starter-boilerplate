import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/reset-password")({
  component: ResetPasswordForm,
  head: () => ({ meta: [{ title: `Set a new password | ${APP_NAME}` }] }),
});
