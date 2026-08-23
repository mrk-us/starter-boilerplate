import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/verify-email")({
  component: VerifyEmailForm,
  head: () => ({ meta: [{ title: `Verify your email | ${APP_NAME}` }] }),
});
