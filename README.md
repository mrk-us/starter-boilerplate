# Starter monorepo with Clerk and Stripe

A Bun and Turborepo starter for a Next.js product with Clerk authentication, Convex, Stripe billing, Resend email, shared Base UI components, and an Electron desktop shell.

## Requirements

- Bun 1.3.14
- Node.js 22.11 or newer

The repository includes an `.nvmrc` pinned to Node 22.

## Workspace

- `apps/app`: authenticated Next.js product app on port 3001
- `apps/web`: public Next.js site on port 3000
- `apps/desktop`: Electron shell for `apps/app`
- `packages/backend`: Convex functions, Clerk integration, Stripe billing, R2 storage, and Resend delivery
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

Copy the app environment example and fill in the Clerk and Convex values:

```sh
cp apps/app/.env.local.example apps/app/.env.local
```

Use `packages/backend/.env.example` as the list of backend values. Set secret values in the Convex deployment environment.

### Clerk

1. Create a Clerk application and copy the publishable key and secret key into
   `apps/app/.env.local`.
2. Enable **Email address** with a password and a verification code, plus the
   Google and GitHub social connections, under **User & authentication**.
3. Activate the [Convex integration](https://dashboard.clerk.com/apps/setup/convex).
   It creates the session token audience Convex expects and reveals the
   Frontend API URL. Set that URL as `CLERK_JWT_ISSUER_DOMAIN` and the secret key
   as `CLERK_SECRET_KEY` in the Convex deployment environment.
4. Add a webhook endpoint subscribed to `user.created`, `user.updated`,
   `user.deleted`, and `email.created`, then set its signing secret as
   `CLERK_WEBHOOK_SIGNING_SECRET` in the Convex deployment environment:

   ```text
   https://<your-convex-site>.convex.site/clerk/webhooks
   ```

Clerk sends verification and password reset emails itself. The `email.created`
handler only takes over once **Custom email delivery** is enabled for the
`verification_code` and `reset_password_code` templates in the Clerk dashboard;
until then the Resend templates in `packages/email` stay unused for those two
emails.

Disposable email addresses are blocked through Clerk's **Restrictions**
settings rather than in application code.

Configure the Stripe webhook endpoint with API version
`2026-07-29.dahlia` at:

```text
https://<your-convex-site>.convex.site/stripe/webhooks
```

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

For a production Electron build, set `DESKTOP_APP_URL` to the deployed URL for `apps/app` and `DESKTOP_CLERK_FRONTEND_API` to the Clerk Frontend API host for that instance (e.g. `clerk.example.com`) before running `bun run build:desktop`.
