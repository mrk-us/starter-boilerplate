import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInForm,
  head: () => ({ meta: [{ title: `Sign in | ${APP_NAME}` }] }),
  validateSearch: z.object({
    // Path the guard bounced the visitor off, restored after signing in.
    redirect: z.string().optional(),
  }),
});
