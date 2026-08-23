export const APP_NAME = "Unremarkable";
export const APP_DESCRIPTION = "Unremarkable is the best way to do nothing.";

// This module is bundled into browser code as well (for the app metadata
// above), and `process` does not exist there.
const env = typeof process === "undefined" ? undefined : process.env;

export const IS_PRODUCTION = env?.NODE_ENV === "production";
