import type { AuthConfig } from "convex/server";

const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

// Convex evaluates this file when pushing code, so an unset issuer fails the
// deploy instead of silently accepting unauthenticated requests at runtime.
if (!issuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN is not set. Copy the Frontend API URL from the Clerk dashboard into the Convex deployment environment."
  );
}

export default {
  providers: [
    {
      // Matches the audience of the Clerk JWT template named "convex".
      applicationID: "convex",
      domain: issuerDomain,
    },
  ],
} satisfies AuthConfig;
