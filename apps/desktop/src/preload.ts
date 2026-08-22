import {
	DESKTOP_BRIDGE_VERSION,
	type DesktopBridge,
	DesktopIpcChannels,
	type DesktopPlatform,
} from "@repo/shared/desktop";
import { contextBridge, ipcRenderer } from "electron";

const bridge: DesktopBridge = {
	bridgeVersion: DESKTOP_BRIDGE_VERSION,
	// SAFETY: Node's platform union covers every target it can compile for;
	// Electron only ships the three in DesktopPlatform.
	platform: process.platform as DesktopPlatform,
	openExternal: (url) =>
		ipcRenderer.invoke(DesktopIpcChannels.openExternal, url),
	windowControls: {
		minimize: () => ipcRenderer.send(DesktopIpcChannels.windowMinimize),
		toggleMaximize: () =>
			ipcRenderer.send(DesktopIpcChannels.windowToggleMaximize),
		close: () => ipcRenderer.send(DesktopIpcChannels.windowClose),
	},
};

contextBridge.exposeInMainWorld("desktop", bridge);
