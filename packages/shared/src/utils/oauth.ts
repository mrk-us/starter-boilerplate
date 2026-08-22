/**
 * Clerk OAuth strategy identifiers. Matches both `signIn.sso({ strategy })` and
 * the raw `provider` value Clerk reports on an external account.
 */
export type OAuthProvider = "oauth_google" | "oauth_github";

export interface OAuthProviderConfig {
  message: string;
  provider: OAuthProvider;
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    message: "You previously signed in with Google.",
    provider: "oauth_google",
  },
  {
    message: "You previously signed in with GitHub.",
    provider: "oauth_github",
  },
];

/**
 * Get OAuth provider message by provider name
 */
export function getOAuthProviderMessage(provider: string): string | undefined {
  return OAUTH_PROVIDERS.find((p) => p.provider === provider)?.message;
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
