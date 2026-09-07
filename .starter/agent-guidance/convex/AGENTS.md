# Convex backend

Read the repository-level `AGENTS.md` before changing this workspace.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

Before changing Convex code, read `convex/_generated/ai/guidelines.md`. It contains version-specific API and architecture guidance that overrides assumptions from training data.

Use the installed Convex skills for common backend tasks.

<!-- convex-ai-end -->

- Keep public functions narrow and use internal functions for trusted orchestration.
- Validate every public argument and enforce authorization at the data boundary.
- Use indexed queries instead of filtering full result sets.
- Run this workspace's `typecheck` and relevant tests after changes.
