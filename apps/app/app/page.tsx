import { APP_NAME } from "@repo/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10 p-6">
      <h1>Dashboard</h1>

      <p>Welcome to {APP_NAME}.</p>
    </main>
  );
}
