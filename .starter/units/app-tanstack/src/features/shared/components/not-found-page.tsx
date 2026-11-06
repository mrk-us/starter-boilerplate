import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <Link className="underline" to="/">
        Go to the home page
      </Link>
    </main>
  );
}
