const { contextBridge, shell } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	openExternal: async (url) => shell.openExternal(url),
});
