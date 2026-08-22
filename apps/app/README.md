# app

The authenticated product app: [TanStack Start](https://tanstack.com/start) on Vite, with WorkOS AuthKit for authentication, Convex for data, Stripe for billing, and the shared design system from `@repo/ui`.

## Development

```sh
bun run dev --filter=app    # from the repository root
bun run dev                 # from this directory
```

The dev server listens on [http://localhost:3001](http://localhost:3001). Copy `.env.local.example` to `.env.local` first — the app fails to boot without `VITE_CONVEX_URL`, and AuthKit reads its `WORKOS_*` values on the first request.

`WORKOS_REDIRECT_URI` must match a redirect URI registered in the WorkOS dashboard, and `WORKOS_COOKIE_PASSWORD` must be at least 32 characters.

## Structure

```text
src/
  routes/          file-based routes; routeTree.gen.ts is generated
  features/        feature-owned components, hooks, and server functions
  router.tsx       router, React Query, Convex, and AuthKit providers
  start.ts         request middleware (CSRF, AuthKit)
```

Routing conventions:

- `_auth` — signed-out pages; redirects to `/` when a session exists.
- `_authenticated` — requires a session; redirects to `/sign-in` otherwise.
- `_authenticated/_setup-complete` — additionally requires a finished onboarding record in Convex.
- `callback.tsx` — the WorkOS OAuth callback; a server-only route, so it never enters the client bundle.

Anything under `features/*/server/` runs on the server only. Files named `*.server.ts` are hard-blocked from the client bundle by the Start plugin.

## Build

```sh
bun run build       # Nitro output in .output/
bun run start       # serve the build
```
