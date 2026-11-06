import { APP_NAME } from "@repo/config";
import type { Metadata } from "next";
import { ConvexStatus } from "@/features/shared/components/convex-status";

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10 p-6">
      <h1>App</h1>
      <ConvexStatus />
    </main>
  );
}
