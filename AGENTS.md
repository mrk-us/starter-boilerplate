# Monorepo: Next.js app (`apps/app`) + Convex backend (`packages/backend`) with auth, billing, and email handling.

## Package manager

- Use **Bun** (`package.json#packageManager`).

## Common commands

- **Dev**: `bun run dev` (turbo)
- **Build**: `bun run build` (turbo)
- **Typecheck (repo)**: `bun run check-types` (turbo)
- **Lint/format**: `bun run check` / `bun run fix` (Ultracite)
- **Backend typecheck**: `bun run typecheck` in `packages/backend` (`tsc --noEmit -p convex`)

## Key locations

- **Next.js app**: `apps/app`
- **Convex backend**: `packages/backend/convex`
- **Shared UI**: `packages/ui` (shadcn + Tailwind)
- **Shared utils**: `packages/shared`
- **Shared config**: `packages/config`
- **Emails**: `packages/email` (React Email)

## Where to add code (high-signal defaults)

- **Frontend feature code**: `/features/<feature>/*` (see `.cursor/rules/organization.mdc`)
- **Backend feature code**: `/convex/<feature>/*` (see `.cursor/rules/convex.mdc`)

## Agent workflow (always)

- Keep plans extremely concise (sacrifice grammar for concision).
- Include real code examples in plans when useful.
- End plans with unresolved questions (if any).
- Always strive for concise, elegant solutions.
- If a problem can be solved in a simpler way, propose it.
- Always consider edge cases, and potential security vulnerabilities, and state them clearly.
- If asked to do too much work at ones, where context is high and resulting performance may become degraded, stop and state that clearly.


## Rules index (progressive disclosure)

- Rules for various aspects of the project are located in [`.cursor/rules/`](.cursor/rules/).
