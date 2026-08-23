import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { UserMenu } from "@/features/shared/components";
import { useEnsureUser } from "@/features/user/hooks";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.userId) {
      throw redirect({ search: { redirect: location.href }, to: "/sign-in" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useEnsureUser();

  return (
    <>
      <UserMenu />
      <Outlet />
    </>
  );
}
