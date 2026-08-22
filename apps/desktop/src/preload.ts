import {
  DESKTOP_BRIDGE_VERSION,
  type DesktopBridge,
  DesktopIpcChannels,
  type DesktopPlatform,
} from "@repo/shared/desktop";
import { contextBridge, ipcRenderer } from "electron";

const bridge: DesktopBridge = {
  bridgeVersion: DESKTOP_BRIDGE_VERSION,
  openExternal: (url) =>
    ipcRenderer.invoke(DesktopIpcChannels.openExternal, url),
  // SAFETY: Node's platform union covers every target it can compile for;
  // Electron only ships the three in DesktopPlatform.
  platform: process.platform as DesktopPlatform,
  windowControls: {
    close: () => ipcRenderer.send(DesktopIpcChannels.windowClose),
    minimize: () => ipcRenderer.send(DesktopIpcChannels.windowMinimize),
    toggleMaximize: () =>
      ipcRenderer.send(DesktopIpcChannels.windowToggleMaximize),
  },
};

contextBridge.exposeInMainWorld("desktop", bridge);
