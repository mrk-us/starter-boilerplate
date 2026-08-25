import { createServerFn } from "@tanstack/react-start";
import { getAuthorizationUrl } from "@workos/authkit-tanstack-react-start";

const GOOGLE_OAUTH_PROVIDER = "GoogleOAuth";

/**
 * Starts a Google OAuth flow. `getAuthorizationUrl` seals the OAuth state and
 * writes the PKCE verifier cookie that `/callback` verifies, so this must only
 * be called when the browser is about to be redirected. It is called without a
 * screen hint because WorkOS rejects the hosted UI hint when a social provider
 * is selected directly.
 */
export const getGoogleOAuthAuthorizationUrl = createServerFn({
  method: "POST",
}).handler(async () => {
  const authorizationUrl = new URL(await getAuthorizationUrl());
  authorizationUrl.searchParams.set("provider", GOOGLE_OAUTH_PROVIDER);

  return authorizationUrl.toString();
});
