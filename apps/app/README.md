# app

The authenticated product app: [TanStack Start](https://tanstack.com/start) on Vite, with Clerk for authentication, Convex for data, Stripe for billing, and the shared design system from `@repo/ui`.

## Development

```sh
bun run dev --filter=app    # from the repository root
bun run dev                 # from this directory
```

The dev server listens on [http://localhost:3001](http://localhost:3001). Copy `.env.local.example` to `.env.local` first — the app fails to boot without `VITE_CONVEX_URL`, and Clerk reads `VITE_CLERK_PUBLISHABLE_KEY` in the browser and `CLERK_SECRET_KEY` on the server.

## Structure

```text
src/
  routes/          file-based routes; routeTree.gen.ts is generated
  features/        feature-owned components, hooks, and utilities
  router.tsx       router, React Query, and Convex query client
  start.ts         request middleware (CSRF, Clerk)
```

Routing conventions:

- `_auth` — signed-out pages; redirects to `/` when a session exists, and validates the `redirect` search param the guards attach.
- `_authenticated` — requires a session; redirects to `/sign-in` otherwise.
- `_authenticated/_setup-complete` — additionally requires a finished onboarding record in Convex.
- `_auth/sso-callback.tsx` — where Clerk finishes an OAuth redirect, including turning an unknown account into a sign-up.

## Build

```sh
bun run build       # Nitro output in .output/
bun run start       # serve the build
```
