import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
  return (
    <>
      <UserMenu />
      <Outlet />
    </>
  );
}
