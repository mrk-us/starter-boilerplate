import { Button } from "@repo/ui/components/button";
import { useRouter } from "@tanstack/react-router";

export function ErrorPage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
      <h1>Something went wrong</h1>
      <p>Please try again.</p>
      {/* Invalidating also resets the error boundary */}
      <Button onClick={() => router.invalidate()}>Try again</Button>
    </main>
  );
}
