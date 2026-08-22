export {};

declare global {
	interface CustomJwtSessionClaims {
		metadata: {
			setupComplete?: boolean;
		};
	}

	/**
	 * Window Controls Overlay — shipped by Chromium and enabled by the Electron
	 * shell's `titleBarOverlay`, but not yet in TypeScript's DOM lib.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay
	 */
	interface WindowControlsOverlayGeometryChangeEvent extends Event {
		readonly titlebarAreaRect: DOMRect;
		readonly visible: boolean;
	}

	interface WindowControlsOverlay extends EventTarget {
		readonly visible: boolean;
		getTitlebarAreaRect(): DOMRect;
		addEventListener(
			type: "geometrychange",
			listener: (event: WindowControlsOverlayGeometryChangeEvent) => void,
			options?: boolean | AddEventListenerOptions,
		): void;
		removeEventListener(
			type: "geometrychange",
			listener: (event: WindowControlsOverlayGeometryChangeEvent) => void,
			options?: boolean | EventListenerOptions,
		): void;
	}

	interface Navigator {
		readonly windowControlsOverlay?: WindowControlsOverlay;
	}
}
