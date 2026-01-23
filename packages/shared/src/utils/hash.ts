/**
 * Create a SHA-256 hash of the input data using Web Crypto API.
 * Works in browsers, Cloudflare Workers, Convex runtime, and Node.js 15+.
 * Returns a truncated 16-character hex string for URL-friendly use.
 */
export async function createSha256Hash(data: string): Promise<string> {
	// Encode the string as a Uint8Array (UTF-8)
	const encoder = new TextEncoder().encode(data);
	// Hash the message using SHA-256
	const hashBuffer = await crypto.subtle.digest("SHA-256", encoder);

	// Convert the ArrayBuffer to a hexadecimal string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	return hashHex.slice(0, 16);
}
