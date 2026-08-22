import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailForm } from "@/features/auth/components";

export const Route = createFileRoute("/_auth/verify-email")({
  component: VerifyEmailForm,
  head: () => ({ meta: [{ title: `Verify your email | ${APP_NAME}` }] }),
  validateSearch: z.object({
    // WorkOS user id, carried over from sign-up so the code can be matched.
    authId: z.string().optional(),
  }),
});
