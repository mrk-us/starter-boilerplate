import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/sign-up")({
  component: SignUpForm,
  head: () => ({ meta: [{ title: `Create an account | ${APP_NAME}` }] }),
});
