import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useReloadOnLostSession } from "@/features/auth/hooks/use-reload-on-lost-session";
import { UserMenu } from "@/features/user/components/user-menu";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      throw redirect({ search: { redirect: location.href }, to: "/sign-in" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useReloadOnLostSession();

  return (
    <>
      <UserMenu />
      <Outlet />
    </>
  );
}
