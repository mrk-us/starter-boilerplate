import { defineConfig } from "electron-vite";

/**
 * The deployed `apps/app` URL the packaged shell renders. Override per release
 * with `DESKTOP_APP_URL=https://app.example.com bun run build:desktop`; the dev
 * script points `ELECTRON_APP_URL` at the local app dev server instead.
 */
const PLACEHOLDER_APP_URL = "https://app.example.com";
const prodAppUrl = process.env.DESKTOP_APP_URL ?? PLACEHOLDER_APP_URL;

if (prodAppUrl === PLACEHOLDER_APP_URL) {
  process.emitWarning(
    `DESKTOP_APP_URL is unset — building against the placeholder ${PLACEHOLDER_APP_URL}. Set it before cutting a release.`
  );
}

/**
 * Clerk's Frontend API host for the deployed instance — the "Frontend API URL"
 * shown in the Clerk dashboard, e.g. `clerk.example.com`. OAuth sign-in
 * redirects through it, so the shell has to be allowed to navigate there.
 * Development instances are served from `*.accounts.dev`, which the shell
 * already allows, so this is only needed for a release build.
 */
const clerkFrontendApiHost = process.env.DESKTOP_CLERK_FRONTEND_API ?? "";

if (!clerkFrontendApiHost) {
  process.emitWarning(
    "DESKTOP_CLERK_FRONTEND_API is unset — production Clerk sign-in will open in the system browser instead of the app window. Set it before cutting a release."
  );
}

const sharedBuild = {
  // main and preload write to the same directory; the `clean` script empties it.
  emptyOutDir: false,
  minify: true,
  outDir: "dist-electron",
  sourcemap: false,
} as const;

/**
 * No `externalizeDepsPlugin` anywhere in this config. Without it every import —
 * the workspace contract included — is inlined into `dist-electron`, so
 * electron-builder resolves no runtime dependencies and packages no
 * `node_modules`. `electron` and Node built-ins stay external either way.
 */
export default defineConfig({
  main: {
    build: {
      ...sharedBuild,
      lib: { entry: "src/main.ts", formats: ["cjs"] },
      rollupOptions: { output: { entryFileNames: "main.cjs" } },
    },
    define: {
      __CLERK_FRONTEND_API_HOST__: JSON.stringify(clerkFrontendApiHost),
      __PROD_APP_URL__: JSON.stringify(prodAppUrl),
    },
  },
  preload: {
    build: {
      ...sharedBuild,
      lib: { entry: "src/preload.ts", formats: ["cjs"] },
      rollupOptions: { output: { entryFileNames: "preload.cjs" } },
    },
  },
});
