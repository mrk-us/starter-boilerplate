import { defineConfig } from "electron-vite";

/**
 * The deployed `apps/app` URL the packaged shell renders. Override per release
 * with `DESKTOP_APP_URL=https://app.example.com bun run build:desktop`; the dev
 * script points `ELECTRON_APP_URL` at the local Next server instead.
 */
const PLACEHOLDER_APP_URL = "https://app.example.com";
const prodAppUrl = process.env.DESKTOP_APP_URL ?? PLACEHOLDER_APP_URL;

if (prodAppUrl === PLACEHOLDER_APP_URL) {
	process.emitWarning(
		`DESKTOP_APP_URL is unset — building against the placeholder ${PLACEHOLDER_APP_URL}. Set it before cutting a release.`,
	);
}

const sharedBuild = {
	outDir: "dist-electron",
	// main and preload write to the same directory; the `clean` script empties it.
	emptyOutDir: false,
	minify: true,
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
		define: { __PROD_APP_URL__: JSON.stringify(prodAppUrl) },
		build: {
			...sharedBuild,
			lib: { entry: "src/main.ts", formats: ["cjs"] },
			rollupOptions: { output: { entryFileNames: "main.cjs" } },
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
