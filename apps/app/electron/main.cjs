const { app, BrowserWindow, Menu } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const next = require("next");

const devServerUrl = process.env.ELECTRON_DEV_URL ?? "http://localhost:3001";
const isDev = !app.isPackaged;

let nextServer = null;
let mainWindow = null;
let appBaseUrl = null;
let pendingDeepLink = null;

const loadEnvFromFiles = () => {
	const envCandidates = [
		".env",
		".env.local",
		".env.production",
		".env.production.local",
	];
	const appPath = app.getAppPath();

	for (const filename of envCandidates) {
		const filePath = path.join(appPath, filename);
		if (!fs.existsSync(filePath)) {
			continue;
		}

		const content = fs.readFileSync(filePath, "utf8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) {
				continue;
			}
			const separatorIndex = trimmed.indexOf("=");
			if (separatorIndex === -1) {
				continue;
			}
			const key = trimmed.slice(0, separatorIndex).trim();
			const value = trimmed.slice(separatorIndex + 1).trim();

			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	}
};

const createMenu = () => {
	const template = [
		{
			label: app.name,
			submenu: [
				{
					label: "Quit",
					accelerator: "CmdOrCtrl+Q",
					click: () => app.quit(),
				},
			],
		},
		{
			label: "View",
			submenu: [
				{ role: "reload" },
				{ role: "toggledevtools", visible: isDev },
				{ type: "separator" },
				{ role: "resetzoom" },
				{ role: "zoomin" },
				{ role: "zoomout" },
				{ type: "separator" },
				{ role: "togglefullscreen" },
			],
		},
		{
			label: "Window",
			submenu: [
				{ role: "minimize" },
				{ role: "zoom" },
				{ type: "separator" },
				{ role: "front" },
				{ type: "separator" },
				{ role: "window" },
			],
		},
	];

	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const waitForDevServer = async (url, timeoutMs = 30000) => {
	const deadline = Date.now() + timeoutMs;

	while (Date.now() < deadline) {
		try {
			const response = await fetch(url, { method: "GET" });
			if (response.ok || response.status < 500) {
				return;
			}
		} catch {
			// Ignore connection errors until timeout.
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	throw new Error(`Dev server not available at ${url}`);
};

const startNextServer = async () => {
	const nextApp = next({ dev: false, dir: app.getAppPath() });
	await nextApp.prepare();

	const handler = nextApp.getRequestHandler();
	const server = http.createServer((req, res) => handler(req, res));

	await new Promise((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => resolve());
		server.on("error", reject);
	});

	nextServer = server;

	const address = server.address();
	if (typeof address !== "object" || address === null) {
		throw new Error("Unable to resolve Next.js server address.");
	}

	return `http://127.0.0.1:${address.port}`;
};

const getDeepLinkPath = (urlString) => {
	try {
		const deepLinkUrl = new URL(urlString);
		const hostPath = deepLinkUrl.host ? `/${deepLinkUrl.host}` : "";
		const normalizedPath =
			deepLinkUrl.pathname === "/" ? "" : deepLinkUrl.pathname;

		return `${hostPath}${normalizedPath}${deepLinkUrl.search}${deepLinkUrl.hash}`;
	} catch {
		return null;
	}
};

const openDeepLink = async (urlString) => {
	const pathAndQuery = getDeepLinkPath(urlString);
	if (!pathAndQuery || !appBaseUrl || !mainWindow) {
		pendingDeepLink = urlString;
		return;
	}

	await mainWindow.loadURL(`${appBaseUrl}${pathAndQuery}`);
	mainWindow.focus();
	pendingDeepLink = null;
};

const createWindow = async () => {
	createMenu();

	mainWindow = new BrowserWindow({
		width: 960,
		height: 600,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			preload: path.join(__dirname, "preload.cjs"),
		},
		titleBarStyle: "hidden",
		transparent: true,
		frame: false,
		trafficLightPosition: { x: 12, y: 12 },
	});

	const contextMenu = Menu.buildFromTemplate([
		{ role: "copy" },
		{ role: "cut" },
		{ role: "paste" },
		{ role: "selectall" },
	]);
	mainWindow.webContents.on("context-menu", (_event, params) => {
		// only show the context menu if the element is editable
		if (params.isEditable) {
			contextMenu.popup();
		}
	});

	if (isDev) {
		await waitForDevServer(devServerUrl);
		appBaseUrl = devServerUrl;
		await mainWindow.loadURL(appBaseUrl);
		mainWindow.webContents.openDevTools({ mode: "detach" });
		if (pendingDeepLink) {
			await openDeepLink(pendingDeepLink);
		}
		return;
	}

	loadEnvFromFiles();
	appBaseUrl = await startNextServer();
	await mainWindow.loadURL(appBaseUrl);
	if (pendingDeepLink) {
		await openDeepLink(pendingDeepLink);
	}
};

if (process.defaultApp) {
	const electronEntry = process.argv[1] ? path.resolve(process.argv[1]) : "";
	app.setAsDefaultProtocolClient("starter", process.execPath, [electronEntry]);
} else {
	app.setAsDefaultProtocolClient("starter");
}

app
	.whenReady()
	.then(createWindow)
	.catch((error) => {
		console.error("Failed to create the Electron window.", error);
		app.quit();
	});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		void createWindow();
	}
});

app.on("open-url", (event, urlString) => {
	event.preventDefault();
	void openDeepLink(urlString);
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("before-quit", () => {
	if (nextServer) {
		nextServer.close();
		nextServer = null;
	}
});
