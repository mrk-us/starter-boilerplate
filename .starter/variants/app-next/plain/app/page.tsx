import { APP_NAME } from "@repo/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-6">
      <h1>{APP_NAME}</h1>
    </main>
  );
}
