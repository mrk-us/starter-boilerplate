// Checks if the code is running in the browser
const isClient = !!(
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
);

export { isClient };
