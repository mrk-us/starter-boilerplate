import { APP_NAME } from "@repo/config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({ meta: [{ title: APP_NAME }] }),
});

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-6">
      <h1>{APP_NAME}</h1>
    </main>
  );
}
