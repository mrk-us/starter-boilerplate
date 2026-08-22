# Plan: Migrate Electron to a t3code-style thin shell

**Repo:** `starter-monorepo-workos-stripe` (Bun workspaces + Turborepo)
**Scope:** Replace the current Electron setup (a full Next.js server embedded in the Electron main process, packaged from inside `apps/app`) with a thin-shell architecture modeled on [pingdotgg/t3code](https://github.com/pingdotgg/t3code): a renderer-less `apps/desktop` whose window renders the `apps/app` Next.js app, a typed `window.desktop` bridge, root-class + CSS-variable styling targeting, and a minimal asar.

**Explicit non-goals (do not build these):**
- No local server process and no custom privileged protocol scheme (t3code needs those because it ships an on-device backend; this repo's backend is Convex + WorkOS in the cloud).
- No renderer code, no React, no routing inside `apps/desktop`. If you find yourself adding UI there, stop — the web app IS the UI.
- No auto-updater in this pass (with a remote renderer the UI updates on every web deploy; shell releases are rare).

**The core adaptation:** t3code's window loads its web SPA through a custom scheme proxying a local origin. We have no local origin, and `apps/app` is a Next.js app with server-side auth (WorkOS) that cannot be statically exported — so the shell loads the **deployed app URL over HTTPS** in production, and `http://localhost:3001` in development. Everything else (typed bridge contract, root classes, CSS variables, bundle-everything packaging) is taken from t3code directly.

---

## Current state (verified facts, for orientation)

- `apps/app` is a Next.js 16 App Router app, dev server on **port 3001** (`next dev --port 3001`).
- Old Electron lives inside `apps/app`: `electron/main.cjs` (boots a full Next server in-process), `electron/preload.cjs` (exposes `window.electron.openExternal`), a `"main"` field, a `"build"` electron-builder block, `dev:electron` / `build:desktop` scripts, and `electron` + `electron-builder` devDeps.
- **Security bug being fixed as part of this migration:** the `build.files` array packages `".env*"` and `node_modules/**` into the asar — server secrets are extractable from the shipped DMG. The new shell must ship neither.
- Runtime detection today is a UA sniff: `apps/app/utils/is-electron.ts` (`userAgent.includes("Electron")` + `window.process?.type` — the latter is dead code under sandbox). Used by `apps/app/utils/index.ts` (re-export), `apps/app/features/shared/components/electron-window.tsx`, `apps/app/features/auth/components/oauth-buttons.tsx`.
- `oauth-buttons.tsx` has an Electron-only WorkOS redirect path (`NEXT_PUBLIC_WORKOS_REDIRECT_URI_ELECTRON` + `window.electron.openExternal` + `starter://` deep-link return). **This entire special case becomes unnecessary**: with the shell loading the real app origin, cookies and redirects behave exactly as in the browser, so desktop uses the standard web OAuth flow in-window.
- `packages/config/src/index.ts` exports `APP_URL` (from `APP_URL` / `NEXT_PUBLIC_APP_URL` env, dev default `http://localhost:3001`).
- `packages/shared` uses per-path exports (`.`, `./errors`, `./utils`) pointing at `src/*.ts` — add `./desktop` the same way.
- Tailwind is v4; the design system CSS is `packages/ui/src/styles/globals.css` and already uses `@custom-variant` (e.g. `dark` at line ~10).
- Root layout: `apps/app/app/layout.tsx` (`<html lang="en" suppressHydrationWarning>`, wraps children in `<ElectronWindow>`).
- Root `package.json` workspaces are `apps/*` + `packages/*`, so a new `apps/desktop` is picked up automatically. `turbo.json` already declares `dev:desktop`, `dev:electron`, `build:desktop` tasks.

---

## Target architecture

```
apps/app        → unchanged product. Detects window.desktop; styles via .electron/.wco
                  root classes + CSS vars. Zero imports from electron.
apps/desktop    → main.ts + preload.ts ONLY. Bundled to dist-electron/*.cjs with ALL
                  deps inlined (t3code's alwaysBundle idea). Loads APP_URL.
packages/shared → src/desktop/index.ts: the DesktopBridge contract (types + channel
                  constants, importable by both sides, no electron imports).
Packaged asar   → dist-electron/main.cjs + dist-electron/preload.cjs + package.json.
                  Nothing else. No node_modules, no .env, no source.
```

---

## Phase 1 — Remove the old integration from `apps/app`

1. Delete `apps/app/electron/` (both `main.cjs` and `preload.cjs`).
2. In `apps/app/package.json`:
   - Remove the `"main"` field and the entire `"build"` block (electron-builder config, including the `starter://` protocol registration).
   - Remove scripts `dev:electron` and `build:desktop`; `dev` / `dev:next` / `build` stay as they are.
   - Remove devDeps `electron` and `electron-builder`.
   - Optional cleanup: `"description": "Starter desktop app"` is now wrong — it's the web app.
3. Delete `apps/app/utils/is-electron.ts` and its re-export from `apps/app/utils/index.ts` (Phase 4 adds the replacement; update importers there).
4. In `apps/app/features/auth/components/oauth-buttons.tsx`: delete the Electron branch entirely — `ELECTRON_REDIRECT_URI`, the `isElectron()` check, and the `window.electron?.openExternal` fallback chain. Desktop now runs the plain web redirect flow. Remove `NEXT_PUBLIC_WORKOS_REDIRECT_URI_ELECTRON` from any `.env.example` / Vercel config notes.
5. Run `bun install` to reconcile the lockfile, then `bun x ultracite fix`.

## Phase 2 — The bridge contract in `packages/shared`

Create `packages/shared/src/desktop/index.ts`. Types and constants only — this file must never import from `electron` (it's consumed by the web bundle):

```ts
export const DESKTOP_BRIDGE_VERSION = 1;

export const DesktopIpcChannels = {
	openExternal: "desktop:open-external",
	windowMinimize: "desktop:window-minimize",
	windowToggleMaximize: "desktop:window-toggle-maximize",
	windowClose: "desktop:window-close",
} as const;

export type DesktopPlatform = "darwin" | "win32" | "linux";

export interface DesktopBridge {
	readonly bridgeVersion: typeof DESKTOP_BRIDGE_VERSION;
	readonly platform: DesktopPlatform;
	openExternal(url: string): Promise<void>;
	readonly windowControls: {
		minimize(): void;
		toggleMaximize(): void;
		close(): void;
	};
}

declare global {
	interface Window {
		desktop?: DesktopBridge;
	}
}
```

Add to `packages/shared/package.json` exports (same shape as `./utils`):

```json
"./desktop": { "types": "./src/desktop/index.ts", "default": "./src/desktop/index.ts" }
```

Extending the bridge later (deep links, badge counts, etc.) means: add to this interface + channel map first, then implement in preload/main. The contract is the single source of truth.

## Phase 3 — New `apps/desktop` shell

### 3.1 `apps/desktop/package.json`

Everything is a devDependency — `electron-vite` bundles all imports into `dist-electron`, so electron-builder finds an empty prod-dependency set and packs **no node_modules** (this is the t3code `alwaysBundle` effect, achieved by simply not externalizing anything):

```json
{
	"name": "desktop",
	"version": "0.1.0",
	"description": "Thin Electron shell rendering the app",
	"private": true,
	"type": "module",
	"main": "dist-electron/main.cjs",
	"scripts": {
		"dev": "electron-vite dev",
		"build": "electron-vite build",
		"package": "electron-vite build && electron-builder --dir",
		"make": "electron-vite build && electron-builder",
		"check-types": "tsc --noEmit"
	},
	"devDependencies": {
		"@electron/fuses": "^2.0.0",
		"@repo/shared": "*",
		"@repo/typescript-config": "*",
		"electron": "^37.4.0",
		"electron-builder": "^26.0.16",
		"electron-vite": "^4.0.0",
		"typescript": "5.9.2"
	}
}
```

(Electron `^37.4.0` matches what the repo already pins; bumping to current stable is fine but do it as its own change.)

### 3.2 `apps/desktop/electron.vite.config.ts`

Do **not** use `externalizeDepsPlugin` — its absence is what makes everything bundle. Output to `dist-electron` with `.cjs` names so the asar allowlist stays one directory:

```ts
import { defineConfig } from "electron-vite";

const PROD_APP_URL = "https://app.YOURDOMAIN.com"; // TODO: set the deployed apps/app URL

export default defineConfig({
	main: {
		define: { __PROD_APP_URL__: JSON.stringify(PROD_APP_URL) },
		build: {
			outDir: "dist-electron",
			lib: { entry: "src/main.ts", formats: ["cjs"] },
			rollupOptions: { output: { entryFileNames: "main.cjs" } },
		},
	},
	preload: {
		build: {
			outDir: "dist-electron",
			lib: { entry: "src/preload.ts", formats: ["cjs"] },
			rollupOptions: { output: { entryFileNames: "preload.cjs" } },
		},
	},
});
```

### 3.3 `apps/desktop/src/main.ts`

Responsibilities, in order: resolve the app URL, create a locked-down window, register IPC for the bridge, enforce navigation policy. Sketch (the agent should flesh out with real types):

```ts
import { app, BrowserWindow, ipcMain, shell, session } from "electron";
import path from "node:path";
import { DesktopIpcChannels } from "@repo/shared/desktop";

declare const __PROD_APP_URL__: string;

const appUrl = process.env.ELECTRON_APP_URL ?? __PROD_APP_URL__;
const appOrigin = new URL(appUrl).origin;

const createWindow = () => {
	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		titleBarStyle: "hidden",
		titleBarOverlay: { height: 36 },
		...(process.platform === "darwin"
			? { trafficLightPosition: { x: 12, y: 12 } }
			: {}),
		webPreferences: {
			preload: path.join(import.meta.dirname, "preload.cjs"),
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false,
		},
	});

	// Same-origin navigation stays in-window (OAuth redirects to WorkOS domains
	// are the one exception the flow needs); everything else goes to the browser.
	win.webContents.on("will-navigate", (event, url) => {
		const origin = new URL(url).origin;
		const allowed =
			origin === appOrigin ||
			origin.endsWith(".workos.com") || // AuthKit hosted pages
			origin.endsWith(".authkit.app");
		if (!allowed) {
			event.preventDefault();
			void shell.openExternal(url);
		}
	});
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (url.startsWith("https:") || url.startsWith("http:")) {
			void shell.openExternal(url);
		}
		return { action: "deny" };
	});

	void win.loadURL(appUrl);
	return win;
};

app.whenReady().then(() => {
	session.defaultSession.setPermissionRequestHandler(
		(_wc, permission, callback) => {
			callback(["clipboard-sanitized-write", "fullscreen", "notifications"].includes(permission));
		},
	);

	ipcMain.handle(DesktopIpcChannels.openExternal, (_e, url: string) => {
		const { protocol } = new URL(url);
		if (protocol === "https:" || protocol === "http:" || protocol === "mailto:") {
			return shell.openExternal(url);
		}
		throw new Error(`Blocked protocol: ${protocol}`);
	});
	ipcMain.on(DesktopIpcChannels.windowMinimize, (e) =>
		BrowserWindow.fromWebContents(e.sender)?.minimize(),
	);
	ipcMain.on(DesktopIpcChannels.windowToggleMaximize, (e) => {
		const w = BrowserWindow.fromWebContents(e.sender);
		if (w) w.isMaximized() ? w.unmaximize() : w.maximize();
	});
	ipcMain.on(DesktopIpcChannels.windowClose, (e) =>
		BrowserWindow.fromWebContents(e.sender)?.close(),
	);

	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
```

Notes for the implementer:
- `titleBarStyle: "hidden"` + `titleBarOverlay` is what makes `navigator.windowControlsOverlay` and the `env(titlebar-area-*)` CSS variables exist in the page — the styling side (Phase 4) depends on it.
- Validate `import.meta.dirname` works in the CJS output of electron-vite; if not, use `__dirname` (available in CJS builds) for the preload path.
- Do NOT port `loadEnvFromFiles`, the embedded Next server, or the `.env` reading from the old `main.cjs` — the shell needs no env at runtime beyond the optional `ELECTRON_APP_URL` dev override.
- The old `starter://` deep-link registration (`setAsDefaultProtocolClient`) is not needed for auth anymore. Leave it out.

### 3.4 `apps/desktop/src/preload.ts`

The whole file — the bridge is deliberately small:

```ts
import { contextBridge, ipcRenderer } from "electron";
import {
	DESKTOP_BRIDGE_VERSION,
	type DesktopBridge,
	DesktopIpcChannels,
	type DesktopPlatform,
} from "@repo/shared/desktop";

const bridge: DesktopBridge = {
	bridgeVersion: DESKTOP_BRIDGE_VERSION,
	platform: process.platform as DesktopPlatform,
	openExternal: (url) => ipcRenderer.invoke(DesktopIpcChannels.openExternal, url),
	windowControls: {
		minimize: () => ipcRenderer.send(DesktopIpcChannels.windowMinimize),
		toggleMaximize: () => ipcRenderer.send(DesktopIpcChannels.windowToggleMaximize),
		close: () => ipcRenderer.send(DesktopIpcChannels.windowClose),
	},
};

contextBridge.exposeInMainWorld("desktop", bridge);
```

(t3code bundles deps into the preload for exactly this setup — "Sandboxed Electron preloads cannot reliably resolve package imports from inside the packaged ASAR". The no-externalize vite config above already guarantees that.)

### 3.5 `apps/desktop/electron-builder.yml`

The `files` allowlist is the size + security core. Model: t3code stages only build outputs; we get the same result via a strict allowlist:

```yaml
appId: com.starter.app
productName: Starter
directories:
  output: out
files:
  - dist-electron/**
  - package.json
asar: true
electronLanguages:
  - en-US
mac:
  target:
    - dmg
    - zip
  category: public.app-category.productivity
afterPack: ./scripts/after-pack-fuses.cjs
```

And `apps/desktop/scripts/after-pack-fuses.cjs` — the fuses hardening t3code/notes get from Forge, applied via electron-builder hook:

```js
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
const path = require("node:path");

module.exports = async (context) => {
	const { electronPlatformName, appOutDir, packager } = context;
	const executable =
		electronPlatformName === "darwin"
			? path.join(appOutDir, `${packager.appInfo.productFilename}.app`)
			: electronPlatformName === "win32"
				? path.join(appOutDir, `${packager.appInfo.productFilename}.exe`)
				: path.join(appOutDir, packager.executableName);

	await flipFuses(executable, {
		version: FuseVersion.V1,
		[FuseV1Options.RunAsNode]: false,
		[FuseV1Options.EnableCookieEncryption]: true,
		[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
		[FuseV1Options.EnableNodeCliInspectArguments]: false,
		[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
		[FuseV1Options.OnlyLoadAppFromAsar]: true,
	});
};
```

Also add `apps/desktop/tsconfig.json` extending `@repo/typescript-config` (node/bundler settings, `types: ["electron-vite/node"]`), and a `.gitignore` for `dist-electron/` and `out/`.

## Phase 4 — Desktop targeting inside `apps/app` (the t3code styling pattern)

### 4.1 Root classes before first paint

In `apps/app/app/layout.tsx`, add an inline script inside `<html>` before `<body>`. It must run pre-hydration (the preload has already set `window.desktop` before any page script executes), so classes are on `<html>` before React ever renders — no FOUC, no hydration mismatch (the `<html>` already has `suppressHydrationWarning`):

```tsx
<script
	// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-hydration runtime class, no user input
	dangerouslySetInnerHTML={{
		__html: `(function(){var d=window.desktop;if(d){document.documentElement.classList.add("electron","electron-"+d.platform);}})();`,
	}}
/>
```

### 4.2 Live `wco` class (copy of t3code's `syncDocumentWindowControlsOverlayClass`)

New client component `apps/app/features/shared/components/desktop-class-sync.tsx`, mounted once in the layout:

```tsx
"use client";

import { useEffect } from "react";

export function DesktopClassSync() {
	useEffect(() => {
		const overlay = navigator.windowControlsOverlay;
		const update = () => {
			document.documentElement.classList.toggle(
				"wco",
				overlay !== undefined && overlay.visible,
			);
		};
		update();
		overlay?.addEventListener("geometrychange", update);
		return () => overlay?.removeEventListener("geometrychange", update);
	}, []);

	return null;
}
```

(`navigator.windowControlsOverlay` needs a type shim; declare it in `apps/app/types/`.)

### 4.3 Tailwind variants + CSS variables in `packages/ui/src/styles/globals.css`

Next to the existing `@custom-variant dark` (~line 10):

```css
@custom-variant electron (&:is(.electron, .electron *));
@custom-variant electron-mac (&:is(.electron-darwin, .electron-darwin *));
@custom-variant electron-win (&:is(.electron-win32, .electron-win32 *));
@custom-variant wco (&:is(.wco, .wco *));
```

And the geometry variables — web-safe defaults on `:root`, overridden by runtime classes (this is t3code's exact pattern: desktop styling flows through variables, never through JS conditionals in components):

```css
:root {
	--titlebar-height: 0px;
	--titlebar-inset-left: 0px;
	--titlebar-inset-right: 0px;
}
.electron {
	--titlebar-height: 36px;
	--titlebar-inset-left: 0.75rem;
	--titlebar-inset-right: 0.75rem;
}
.wco {
	--titlebar-height: env(titlebar-area-height, 36px);
	--titlebar-inset-left: calc(env(titlebar-area-x, 0px) + 0.75rem);
	--titlebar-inset-right: calc(
		100vw - env(titlebar-area-width, 100vw) - env(titlebar-area-x, 0px) + 0.75rem
	);
}
```

Usage in components: `electron:pt-(--titlebar-height)`, `electron-mac:pl-(--titlebar-inset-left)`, etc. The app's top bar (whichever component renders it) gets a drag region under Electron only:

```
electron:[app-region:drag]
```

with `[app-region:no-drag]` on interactive children (buttons, inputs) inside it.

### 4.4 Replace the JS detection

New `apps/app/utils/desktop.ts` (re-export from `apps/app/utils/index.ts` where `isElectron` was):

```ts
import type { DesktopBridge } from "@repo/shared/desktop";

export const getDesktop = (): DesktopBridge | undefined =>
	typeof window === "undefined" ? undefined : window.desktop;

export const openExternal = (url: string): void => {
	const desktop = getDesktop();
	if (desktop) {
		void desktop.openExternal(url);
		return;
	}
	window.open(url, "_blank", "noopener");
};
```

Rule for all future desktop-conditional **behavior**: gate on capability (`getDesktop()?.openExternal`), never on identity sniffing. For desktop-conditional **appearance**: use the CSS variants, not JS.

### 4.5 Rework `ElectronWindow`

`apps/app/features/shared/components/electron-window.tsx` currently branches on `isElectron()` in JS. Convert it to pure CSS so it renders identically on server and client (delete the client-side branch entirely):

```tsx
export function ElectronWindow({ children }: { children: ReactNode }) {
	return (
		<div className="contents electron:block electron:fixed electron:h-dvh electron:w-dvw electron:overflow-hidden electron:rounded-[24px] electron:bg-page">
			<div className="electron:size-full electron:overflow-auto contents electron:block">
				{children}
			</div>
		</div>
	);
}
```

(Exact classes are the implementer's call — the requirement is: no `isElectron()`-style runtime branching for styling; the `.electron` root class drives it.)

## Phase 5 — Monorepo wiring

- `turbo.json` already has `dev:desktop` / `build:desktop` task entries; repoint root scripts (root `package.json`) so:
  - `bun run dev:desktop` → runs `apps/app` dev (port 3001) and `apps/desktop` dev concurrently. In `apps/desktop`'s dev script, set the override: `ELECTRON_APP_URL=http://localhost:3001 electron-vite dev` (put the env in the script or a `.env.development` electron-vite picks up — but never a committed secret; it's just a URL).
  - `bun run build:desktop` → `turbo run make --filter=desktop` (which runs `electron-vite build && electron-builder`). Remove the old meaning (Next build + electron-builder in apps/app).
- `bun install` at root to link the new workspace.
- Run `bun x ultracite fix` across the changed packages; keep the repo's tab-indent style in new files.

## Phase 6 — Verification (do all of these before calling it done)

1. **Dev loop:** `apps/app` dev running on 3001 → `bun run dev` in `apps/desktop` opens a window showing the app. In devtools console: `document.documentElement.className` contains `electron` and `electron-darwin`; `window.desktop.bridgeVersion === 1`; on a WCO-capable config the `wco` class appears.
2. **Auth:** complete a WorkOS sign-in inside the desktop window with the standard web flow (no `starter://` involvement). Session persists across app relaunch (cookie encryption fuse is on).
3. **Navigation policy:** an `<a target="_blank">` and `openExternal()` both land in the default browser; the desktop window never navigates to a third-party origin.
4. **Web regression:** `bun run build` in `apps/app` succeeds and the browser app is visually unchanged (all `electron:`/`wco:` styles inert without the root classes). Verify no `electron` module ends up in the web bundle (the contract import is types + string constants only).
5. **Package audit (the size/security acceptance test):**
   ```
   cd apps/desktop && bun run package
   npx @electron/asar list out/mac-arm64/Starter.app/Contents/Resources/app.asar
   ```
   The listing must contain **only** `package.json`, `dist-electron/main.cjs`, `dist-electron/preload.cjs` (+ sourcemaps if emitted — prefer disabling them for release). It must contain **no** `node_modules`, **no** `.env*`, **no** `.next`. Expected: asar well under 1 MB; DMG ≈ 110–130 MB (Electron framework floor).
6. **Fuses:** `npx @electron/fuses read --app out/mac-arm64/Starter.app` shows RunAsNode disabled, OnlyLoadAppFromAsar + asar integrity enabled.
7. `bun x ultracite check` and `check-types` pass in all touched workspaces.

## Invariants (hold these regardless of implementation details)

- `apps/desktop` never imports React or renders local HTML; the only renderer content is the loaded app URL.
- The asar allowlist stays `dist-electron/** + package.json`. Adding anything else requires justification.
- No `.env*` file is read by or packaged with the shell.
- `webPreferences` stay `contextIsolation: true, sandbox: true, nodeIntegration: false`.
- The bridge contract in `packages/shared/src/desktop` is the only interface between web and shell; every IPC channel goes through its constants.
- Web-first: every desktop style has a web-safe default; the browser build must never regress.

## Explicitly deferred (note in follow-ups, don't build now)

- `PROD_APP_URL` placeholder must be set to the real deployed URL before any release build.
- Code signing / notarization (mac) and Windows/Linux targets.
- electron-updater for shell self-updates.
- Offline support (would require the custom-scheme + static-serving variant; the bridge/CSS work here carries over unchanged).
