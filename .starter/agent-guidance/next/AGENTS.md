<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Next.js workspace

Read the repository-level `AGENTS.md` before changing this workspace.

- Use App Router conventions and keep server-only work out of client components.
- Prefer Server Components unless browser state, effects, or event handlers require a Client Component.
- Use the metadata API for document metadata and the framework image component for optimized images.
- Run this workspace's `typecheck` and relevant tests after changes.
