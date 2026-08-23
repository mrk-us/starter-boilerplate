import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInForm,
  head: () => ({ meta: [{ title: `Sign in | ${APP_NAME}` }] }),
});
