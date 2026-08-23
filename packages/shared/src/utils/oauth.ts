/**
 * Clerk names the same provider two ways: `provider` on an external account is
 * the bare slug, while `signIn.sso()` takes the `oauth_`-prefixed strategy.
 */
export type OAuthProvider = "google" | "github";
export type OAuthStrategy = `oauth_${OAuthProvider}`;

export interface OAuthProviderConfig {
  message: string;
  provider: OAuthProvider;
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    message: "You previously signed in with Google.",
    provider: "google",
  },
  {
    message: "You previously signed in with GitHub.",
    provider: "github",
  },
];

const OAUTH_STRATEGY_PREFIX = /^oauth_/;

/**
 * Get OAuth provider message by provider name
 *
 * Accepts either naming: the backend SDK types `ExternalAccount.provider` as a
 * bare `string`, so the prefixed strategy can reach this too.
 */
export function getOAuthProviderMessage(provider: string): string | undefined {
  const slug = provider.replace(OAUTH_STRATEGY_PREFIX, "");

  return OAUTH_PROVIDERS.find((p) => p.provider === slug)?.message;
}

/**
 * Get OAuth provider message for a list of providers
 * Returns the first matching provider's message
 */
export function getOAuthProvidersMessage(
  providers: string[]
): string | undefined {
  for (const provider of providers) {
    const message = getOAuthProviderMessage(provider);
    if (message) {
      return message;
    }
  }
  return undefined;
}
