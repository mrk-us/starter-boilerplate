import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexStatus } from "@/features/shared/components/convex-status";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: APP_NAME }] }),
});

function Home() {
  return <ConvexStatus />;
}
