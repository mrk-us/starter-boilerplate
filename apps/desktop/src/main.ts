import path from "node:path";
import { DesktopIpcChannels } from "@repo/shared/desktop";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  session,
  shell,
  type WebContents,
} from "electron";
import { ALLOWED_NAVIGATION_HOSTS } from "./navigation-hosts";

/** Replaced at build time by `electron.vite.config.ts`. */
declare const __PROD_APP_URL__: string;

const APP_URL = process.env.ELECTRON_APP_URL ?? __PROD_APP_URL__;
const APP_ORIGIN = new URL(APP_URL).origin;

const EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

const GRANTED_PERMISSIONS = new Set([
  "clipboard-sanitized-write",
  "fullscreen",
  "notifications",
]);

const TITLEBAR_HEIGHT = 36;
const TRAFFIC_LIGHT_INSET = 12;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const MIN_WIDTH = 720;
const MIN_HEIGHT = 480;

const DARK_BACKGROUND = "#000000";
const LIGHT_BACKGROUND = "#f0f0f0";

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const isAllowedNavigation = (value: string): boolean => {
  const url = parseUrl(value);

  if (!url) {
    return false;
  }

  if (url.origin === APP_ORIGIN) {
    return true;
  }

  if (url.protocol !== "https:") {
    return false;
  }

  return ALLOWED_NAVIGATION_HOSTS.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
  );
};

const openExternal = async (value: string): Promise<void> => {
  const url = parseUrl(value);

  if (!(url && EXTERNAL_PROTOCOLS.has(url.protocol))) {
    throw new Error(`Refusing to open URL with blocked protocol: ${value}`);
  }

  await shell.openExternal(url.href);
};

/** Best-effort hand-off to the browser; a blocked scheme is simply dropped. */
const openExternalSafely = (value: string): Promise<void> =>
  openExternal(value).catch(() => undefined);

const editContextMenu = Menu.buildFromTemplate([
  { role: "undo" },
  { role: "redo" },
  { type: "separator" },
  { role: "cut" },
  { role: "copy" },
  { role: "paste" },
  { role: "selectAll" },
]);

const guardNavigation = (
  event: { isMainFrame: boolean; preventDefault: () => void },
  url: string
): void => {
  // Frames do not get window.desktop, and Stripe pages embed other hosts
  if (!event.isMainFrame || isAllowedNavigation(url)) {
    return;
  }

  event.preventDefault();
  openExternalSafely(url);
};

const applyContentsPolicy = (contents: WebContents): void => {
  contents.on("will-navigate", guardNavigation);
  contents.on("will-redirect", guardNavigation);

  contents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: "deny" };
  });

  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  contents.on("context-menu", (_event, params) => {
    if (params.isEditable) {
      editContextMenu.popup();
    }
  });
};

const loadApp = async (window: BrowserWindow): Promise<void> => {
  try {
    await window.loadURL(APP_URL);
  } catch (error) {
    console.error("Failed to load the app URL:", error);

    if (window.isDestroyed()) {
      return;
    }

    window.show();

    // Another navigation replaced this load, so nothing is wrong to report
    if ((error as NodeJS.ErrnoException).code === "ERR_ABORTED") {
      return;
    }

    const { response } = await dialog.showMessageBox(window, {
      buttons: ["Retry", "Quit"],
      cancelId: 1,
      defaultId: 0,
      detail: "Check your connection and try again.",
      message: `${app.getName()} could not load.`,
      type: "error",
    });

    if (response === 0) {
      await loadApp(window);
    } else {
      app.quit();
    }
  }
};

const createWindow = (): void => {
  const window = new BrowserWindow({
    backgroundColor: nativeTheme.shouldUseDarkColors
      ? DARK_BACKGROUND
      : LIGHT_BACKGROUND,
    height: DEFAULT_HEIGHT,
    minHeight: MIN_HEIGHT,
    minWidth: MIN_WIDTH,
    show: false,
    titleBarOverlay: { height: TITLEBAR_HEIGHT },
    // `titleBarStyle: "hidden"` plus `titleBarOverlay` is what makes
    // `navigator.windowControlsOverlay` and the `env(titlebar-area-*)` CSS
    // variables exist in the page — the web app's `.wco` styling depends on it.
    titleBarStyle: "hidden",
    trafficLightPosition: { x: TRAFFIC_LIGHT_INSET, y: TRAFFIC_LIGHT_INSET },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(import.meta.dirname, "preload.cjs"),
      sandbox: true,
      webviewTag: false,
    },
    width: DEFAULT_WIDTH,
  });

  window.once("ready-to-show", () => window.show());
  loadApp(window);
};

const focusExistingWindow = (): void => {
  const [window] = BrowserWindow.getAllWindows();

  if (!window) {
    createWindow();
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();
};

const registerIpcHandlers = (): void => {
  ipcMain.handle(DesktopIpcChannels.openExternal, (_event, url: string) =>
    openExternal(url)
  );

  ipcMain.on(DesktopIpcChannels.windowMinimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on(DesktopIpcChannels.windowToggleMaximize, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      return;
    }

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.on(DesktopIpcChannels.windowClose, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
};

const registerPermissionHandlers = (): void => {
  session.defaultSession.setPermissionRequestHandler(
    (_contents, permission, callback) => {
      callback(GRANTED_PERMISSIONS.has(permission));
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (_contents, permission, requestingOrigin) =>
      // Electron passes this origin with a trailing slash
      parseUrl(requestingOrigin)?.origin === APP_ORIGIN &&
      GRANTED_PERMISSIONS.has(permission)
  );
};

if (app.requestSingleInstanceLock()) {
  app.on("second-instance", focusExistingWindow);

  app.on("web-contents-created", (_event, contents) => {
    applyContentsPolicy(contents);
  });

  app.whenReady().then(() => {
    registerPermissionHandlers();
    registerIpcHandlers();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
} else {
  app.quit();
}
