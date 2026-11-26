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
- Throw errors people or agents read as `ConvexError({ code, message })`. Generic codes such as `NOT_FOUND`, `FORBIDDEN` and `INVALID_INPUT` live in `convex/errors/constants.ts`; a feature's `constants.ts` adds only the codes specific to it and imports the generic ones.
- Run this workspace's `typecheck` and relevant tests after changes.
