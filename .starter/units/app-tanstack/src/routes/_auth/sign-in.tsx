import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInForm } from "@/features/auth/components";

// A single leading slash, and neither a second slash nor a backslash after it:
// browsers normalise `/\evil.example` to `//evil.example`, which resolves to
// another origin once assigned to `window.location`.
const SAME_ORIGIN_PATH = /^\/(?![/\\])/;

export const Route = createFileRoute("/_auth/sign-in")({
  component: SignInForm,
  head: () => ({ meta: [{ title: `Sign in | ${APP_NAME}` }] }),
  validateSearch: z.object({
    // Path the guard bounced the visitor off, restored after signing in. The
    // form navigates to it, so anything that could leave the origin is dropped
    // rather than rejected: a tampered link should still reach the form.
    redirect: z.string().regex(SAME_ORIGIN_PATH).optional().catch(undefined),
  }),
});
