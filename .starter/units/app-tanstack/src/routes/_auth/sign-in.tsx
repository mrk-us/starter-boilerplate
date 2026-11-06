import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInForm } from "@/features/auth/components";
import { getReturnPath } from "@/features/auth/return-path";

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInForm,
  head: () => ({ meta: [{ title: `Sign in | ${APP_NAME}` }] }),
  validateSearch: z.object({
    error: z.literal("oauth").optional().catch(undefined),
    notice: z.enum(["reset", "verified"]).optional().catch(undefined),
    redirect: z.string().transform(getReturnPath).optional().catch(undefined),
  }),
});
