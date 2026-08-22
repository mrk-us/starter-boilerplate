/**
 * The contract between the web app (`apps/app`) and the Electron shell
 * (`apps/desktop`).
 *
 * This module is part of the browser bundle, so it must never import from
 * `electron` — types and string constants only.
 */

/**
 * The shell and the web app ship on independent release cycles, so a running
 * window may be an old desktop build against a new deploy. Bump this whenever
 * the shape below changes incompatibly; the web side can then detect a shell
 * too old to serve it.
 */
export const DESKTOP_BRIDGE_VERSION = 1;

export const DesktopIpcChannels = {
	openExternal: "desktop:open-external",
	windowMinimize: "desktop:window-minimize",
	windowToggleMaximize: "desktop:window-toggle-maximize",
	windowClose: "desktop:window-close",
} as const;

export type DesktopPlatform = "darwin" | "win32" | "linux";

export type DesktopWindowControls = {
	minimize(): void;
	toggleMaximize(): void;
	close(): void;
};

export type DesktopBridge = {
	readonly bridgeVersion: typeof DESKTOP_BRIDGE_VERSION;
	readonly platform: DesktopPlatform;
	openExternal(url: string): Promise<void>;
	readonly windowControls: DesktopWindowControls;
};

declare global {
	interface Window {
		/** Injected by the Electron preload. `undefined` in a browser. */
		desktop?: DesktopBridge;
	}
}
