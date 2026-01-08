export const IS_PRODUCTION = process.env.NODE_ENV === "production";

const DEFAULT_APP_URL_DEV = "http://localhost:3001";

const envAppUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
const normalizedEnvAppUrl = envAppUrl.replace(/\/$/, "");

// Important for emails: if this is empty, links become relative ("/verify-email?..."),
// and some clients (e.g. Apple Mail) rewrite them to internal schemes like `x-webdoc://`.
export const APP_URL =
	IS_PRODUCTION && normalizedEnvAppUrl
		? normalizedEnvAppUrl
		: DEFAULT_APP_URL_DEV;
