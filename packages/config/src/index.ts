export const APP_NAME = "Unremarkable";
export const APP_DESCRIPTION = "Unremarkable is the best way to do nothing.";

const DEFAULT_APP_URL_DEV = "http://localhost:3001";

// This module is bundled into browser code as well (for the app metadata
// above), and `process` does not exist there.
const env = typeof process === "undefined" ? undefined : process.env;

export const IS_PRODUCTION = env?.NODE_ENV === "production";

const configuredAppUrl = env?.APP_URL?.replace(/\/$/, "") ?? "";

// Important for emails: if this is empty, links become relative ("/verify-email?..."),
// and some clients (e.g. Apple Mail) rewrite them to internal schemes like `x-webdoc://`.
export const APP_URL =
  IS_PRODUCTION && configuredAppUrl ? configuredAppUrl : DEFAULT_APP_URL_DEV;
