<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes—APIs, conventions, and file structure may differ from your training data. Before relying on Next.js behavior, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent rules

## Repository

This is a Bun-managed Turborepo.

- `apps/web` - Next.js marketing site.
- `packages/config` - Shared configuration.
- `packages/ui` - Shared UI components.
- `packages/shared` - Shared utils.

## Core principles

Write code that is accessible, performant, type-safe, and maintainable. Prefer clarity and explicit intent over brevity.

Do not preserve complexity merely because it already exists, and do not introduce machinery because it appears architecturally impressive. Understand the real constraint, then implement the smallest model that makes correct behavior unsurprising.

Balance “measure twice, cut once” with YAGNI. Fight scope creep while honoring the developer’s intent in a minimal but realistic way.

Treat these instructions as strong defaults unless the current task or an explicit developer instruction overrides them.

## Package manager

- Use the package manager configured by the repository: Bun.
- Do not switch package managers.
- If the required Bun version is unavailable, report it rather than installing or changing system tooling without authorization.

## Design process

When changing UI, animations, styling, layout, or any other visual aspect:

- Follow the project design system first. If `DESIGN.md` exists, treat it as the primary design reference.
- Search for additional project-specific design guidance in relevant instruction files under `.cursor/`, `.claude/`, `.codex/`, `.opencode/`, and similar directories.
- Follow established patterns when no explicit guidance exists. Reuse components from `packages/ui` and match how they are already used elsewhere.
- Do not modify the internal styles or source of design-system components unless the task explicitly requires it.
- Prefer consistency with existing component usage, layout, styling, interaction, and animation conventions before introducing new patterns.
- Push back when a proposed design conflicts with the project’s established system. Explain the conflict concisely with relevant examples.
- Explicit developer or task instructions take precedence. Once the trade-off has been explained and the developer confirms the direction, follow it.

## Code style

### Blast radius

Never modify the `production` branch, a live database, or a deployed production system without explicit instruction.

Treat `main` as the development integration branch, not as blanket permission to merge, push, rebase, or deploy. Only perform branch operations authorized by the current task.

### Comment hygiene

Match the surrounding code’s comment density and style. Comments should explain information that the implementation cannot make obvious, such as:

- non-obvious reasons or constraints;
- business rules and invariants;
- external API, browser, framework, or compatibility quirks;
- security, privacy, or performance trade-offs;
- limitations whose cause matters to future maintainers.

Avoid comments that narrate syntax, restate names, describe the conversation, or document what an AI chose.

For example, avoid:

```ts
// We need this because, as you mentioned, Stripe can send the event twice.
```

Prefer:

```ts
// Stripe may deliver the same event more than once; processing must remain idempotent.
```

Keep comments synchronized with the code.

### Type slop

Avoid:

- chained type assertions;
- `as unknown as T`, `as any as T`, and equivalent assertion laundering;
- widening known values to `unknown`, `any`, `object`, `{}`, broad `Record` types, or anonymous containers and narrowing them again later;
- unnecessary explicit annotations that discard useful inference;
- `Record<string, unknown>` when a concrete owner or domain type exists;
- propagating `unknown` deep into application code instead of parsing it at an I/O boundary;
- ad hoc shape checking spread through business logic when a boundary parser would be clearer;
- assertions used instead of narrowing, parsing, inference, `satisfies`, or a better API contract;
- aliases that merely hide broad placeholder types.

Prefer:

- inference;
- `as const` when literal preservation is intentional;
- `satisfies` when a value should be checked without widening;
- named domain or owner types;
- parsing untrusted data once at the boundary;
- preserving precise types through the complete local flow.

`unknown`, `typeof`, type guards, and assertions remain valid at real boundaries. Judge them by information flow and context rather than banning them mechanically.

### Structural slop

Avoid abstractions that add indirection without adding meaning:

- single-use wrappers, adapters, factories, managers, or configuration objects;
- functions that merely forward arguments;
- speculative extensibility or compatibility paths;
- defensive branches for states that have no evidence of occurring;
- redundant checks after validation;
- needless intermediate objects and transformations;
- generated boilerplate that obscures the domain behavior.

For example, a single-use `createUserManager()` that only calls `createUser()` should usually be removed in favor of calling `createUser()` directly.

Prefer the simplest structure that keeps domain intent explicit. Preserve abstractions that represent a real boundary, policy, reuse point, dependency seam, or domain concept.

### Error handling

Do not swallow errors, replace useful failures with generic messages, or let invalid state continue through invented fallback values.

Avoid catch-and-rethrow code unless it adds meaningful boundary context, cleanup, translation, retry behavior, or redaction. Do not log an error and then rethrow it when that produces duplicate reporting.

When adding context, preserve the original cause:

```ts
throw new Error("Unable to create the subscription", { cause: error });
```

Keep intentional `finally` cleanup, retry policy, boundary translation, and security-sensitive redaction.

### Naming and prose

Prefer names that express domain meaning.

Use `invoice`, `webhookPayload`, or `parseStripeEvent` instead of generic names such as `data`, `item`, `result`, `processor`, or `helper` when the domain is known.

Avoid:

- names that describe implementation steps instead of intent;
- unnecessary `manager`, `processor`, `handler`, `utils`, or `config` suffixes;
- verbose errors, comments, docstrings, or UI copy written like chat prose.

Short generic names remain appropriate when their meaning is obvious from a small local scope.

## Validation

After editing:

1. Run formatter and linter checks relevant to the touched files. Do not run a repository-wide autofix when it could alter unrelated work.
2. Run the relevant workspace or repository typecheck when it provides useful coverage.
3. Run focused tests for the changed behavior.
4. Run a full build only when the change requires it, the developer requests it, or no cheaper check provides reliable verification.
5. Do not start the development server unless requested; assume the developer may already be running it.

If a validation command cannot be run safely or reliably, report it as skipped and explain why.

## Pull requests

- Never make a PR unless the developer explicitly asks you to do so.
- Never merge a PR or branch unless the developer explicitly asks you to do so.
- Use conventional commit titles in plain language, such as `fix(web): new threads no longer spike CPU`.
- Describe the problem briefly, followed by how it was fixed.
- Keep one concern per PR. If the description needs an unrelated “also,” split the PR.
- End the PR description with a short note identifying the model and harness that made the changes, or which models touched which files.
- Open a real PR rather than a draft because drafts do not receive review-bot coverage.
- When opening a PR, first bring the branch up to date with `main` using the repository’s expected workflow.

## Organize files by feature

Structure application code around user-facing features rather than technical layers. Each feature owns its components, hooks, utilities, and feature-specific types.

A typical application layout is:

```text
features/
  auth/
    components/
    hooks/
    utils/
  billing/
    components/
    hooks/
    utils/
  shared/
    components/
    hooks/
    utils/
```

### Abstraction ladder

Place code according to its widest real consumer:

1. Used by one component: keep it inline unless it is an independently useful design-system primitive.
2. Used by multiple components in one feature: place it in that feature’s `components/`, `hooks/`, or `utils/`.
3. Used across multiple features: move it to `features/shared/`.
4. Design-system primitives: keep them in `packages/ui`; they are not application features.

A generic, domain-agnostic primitive may enter `shared` before it has a second consumer when its independent API and likely reuse are already clear. Treat this as an exception, not a reason to extract ordinary single-use code.

A file’s location is determined by its widest consumer. Shared code must remain domain-agnostic and must not depend on a specific feature. Feature-to-feature dependencies are acceptable when they represent real domain relationships.

Never extract Tailwind class strings into shared constants merely to reuse the strings; doing so breaks intellisense.

## Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

Tests are good. Endless smoke tests, "regression tests" for feature deletions, etc. are not. Tests should protect meaningful behavior without becoming ceremonial or duplicating implementation details.

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code
