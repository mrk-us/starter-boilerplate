import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { UserData } from "@/features/user/components/user-data";

export const Route = createFileRoute("/_authenticated/_setup-complete/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: `Dashboard | ${APP_NAME}` }] }),
});

function Dashboard() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10 p-6">
      <h1>Dashboard</h1>

      <UserData />
    </main>
  );
}
