import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
      <h1>Page not found</h1>
      <p>This page does not exist.</p>
      <Link className="underline" href="/">
        Go to the home page
      </Link>
    </main>
  );
}
