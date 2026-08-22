import { useEffect } from "react";

/**
 * Keeps the `wco` root class in step with the Window Controls Overlay, whose
 * visibility follows window state at runtime — entering fullscreen hides it.
 * The initial value is already set pre-hydration in the root layout, so this
 * only handles later changes. The overlay's geometry reaches components through
 * the `--titlebar-*` CSS variables rather than from here.
 */
export function DesktopClassSync() {
  useEffect(() => {
    const overlay = navigator.windowControlsOverlay;

    if (!overlay) {
      return;
    }

    const update = () => {
      document.documentElement.classList.toggle("wco", overlay.visible);
    };

    update();
    overlay.addEventListener("geometrychange", update);

    return () => overlay.removeEventListener("geometrychange", update);
  }, []);

  return null;
}
