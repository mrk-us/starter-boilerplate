# Starter monorepo with WorkOS and Stripe

A Bun and Turborepo starter for a Next.js product with WorkOS authentication, Convex, Stripe billing, Resend email, shared Base UI components, and an Electron desktop shell.

## Requirements

- Bun 1.3.14
- Node.js 22.11 or newer

The repository includes an `.nvmrc` pinned to Node 22.

## Workspace

- `apps/app`: authenticated Next.js product app on port 3001
- `apps/web`: public Next.js site on port 3000
- `apps/desktop`: Electron shell for `apps/app`
- `packages/backend`: Convex functions, WorkOS integration, Stripe billing, R2 storage, and Resend delivery
- `packages/email`: React Email templates and local preview server
- `packages/ui`: shared shadcn components built on Base UI, Tailwind CSS, and Typeset
- `packages/config`: shared runtime configuration
- `packages/shared`: shared TypeScript helpers
- `packages/typescript-config`: shared TypeScript settings

## Setup

Install the workspace dependencies:

```sh
bun install --frozen-lockfile
```

Copy the app environment example and fill in the WorkOS and Convex values:

```sh
cp apps/app/.env.local.example apps/app/.env.local
```

Use `packages/backend/.env.example` as the list of backend values. Set secret values in the Convex deployment environment. The WorkOS webhook endpoint is:

```text
https://<your-convex-site>.convex.site/workos/webhooks
```

The Stripe webhook endpoint comes from the Convex Stripe component after backend setup.

## Commands

```sh
bun run dev             # Run the web apps and package development tasks
bun run dev:desktop     # Run apps/app and Electron together
bun run build           # Build the full workspace
bun run build:desktop   # Build and package the desktop app
bun run typecheck       # Typecheck every workspace package
bun run check           # Check with Ultracite and Biome
bun run fix             # Apply Ultracite and Biome fixes
bun run doctor          # Check the linting setup
```

Run the email preview from its package:

```sh
cd packages/email
bun run dev
```

For a production Electron build, set `DESKTOP_APP_URL` to the deployed URL for `apps/app` before running `bun run build:desktop`.
