import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordForm,
  head: () => ({ meta: [{ title: `Reset your password | ${APP_NAME}` }] }),
});
