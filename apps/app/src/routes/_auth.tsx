import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";

// A single leading slash, and neither a second slash nor a backslash after it:
// browsers normalise `/\evil.example` to `//evil.example`, which resolves to
// another origin once assigned to `window.location`.
const SAME_ORIGIN_PATH = /^\/(?![/\\])/;

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    if (context.userId) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
  // Declared on the layout because a Clerk flow can finish on any of these
  // pages — verifying a code, resetting a password, returning from SSO — and
  // each of them needs the destination the guard bounced the visitor off.
  validateSearch: z.object({
    // The forms navigate to this path, so anything that could leave the origin
    // is dropped rather than rejected: a tampered link should still reach the
    // form.
    redirect: z.string().regex(SAME_ORIGIN_PATH).optional().catch(undefined),
  }),
});

function AuthLayout() {
  return (
    <div className="flex size-screen h-svh flex-row items-center bg-surface p-5 *:w-full *:flex-1">
      <div>
        <Outlet />
      </div>

      <div className="corner-superellipse/1.2 hidden self-stretch rounded-3xl bg-page lg:block" />
    </div>
  );
}
