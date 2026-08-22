import { createClerkClient } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "CLERK_SECRET_KEY is not set. Copy it from the Clerk dashboard into the Convex deployment environment."
  );
}

/**
 * Clerk Backend API client
 *
 * `@clerk/backend` only relies on `fetch` and Web Crypto, so this module works
 * in both the default Convex runtime and Node actions.
 */
export const clerk = createClerkClient({ secretKey });
