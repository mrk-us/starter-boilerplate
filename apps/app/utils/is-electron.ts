type WindowWithProcess = Window & {
	process?: {
		type?: string;
	};
};

export const isElectron = (): boolean => {
	if (typeof window === "undefined") {
		return false;
	}

	const userAgent = window.navigator?.userAgent ?? "";
	const { process } = window as WindowWithProcess;
	const isRenderer = process?.type === "renderer";

	return userAgent.includes("Electron") || isRenderer;
};
