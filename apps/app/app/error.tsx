"use client";

import { Button } from "@repo/ui/components/button";

export default function ErrorPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
      <h1>Something went wrong</h1>
      <p>Please try again.</p>
      {/* `reset` re-renders only on the client, so it cannot recover a failed server render */}
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </main>
  );
}
