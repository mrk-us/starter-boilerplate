import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getReturnPath } from "@/features/auth/return-path";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context, location }) => {
    if (context.user) {
      throw redirect({
        href: getReturnPath(
          new URLSearchParams(location.searchStr).get("redirect")
        ),
      });
    }
  },
  component: AuthLayout,
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
