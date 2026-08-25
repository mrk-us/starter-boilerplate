import type { Metadata } from "next";
import { Suspense } from "react";
import { UserData } from "@/features/user/components/user-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-10 p-6">
      <h1>Dashboard</h1>

      <Suspense fallback={<div>Loading...</div>}>
        <UserData />
      </Suspense>
    </main>
  );
}
