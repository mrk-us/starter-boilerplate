# Electron workspace

Read the repository-level `AGENTS.md` before changing this workspace.

- Keep privileged operations in the main process and expose the smallest safe preload API.
- Keep context isolation enabled. Do not expose Node.js primitives directly to renderer code.
- Preserve the browser app as the source of product UI and keep the desktop shell thin.
- Run this workspace's `typecheck` and relevant tests after changes.
