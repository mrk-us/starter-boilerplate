export type OAuthProvider = "GoogleOAuth" | "GitHubOAuth";

export interface OAuthProviderConfig {
  message: string;
  provider: OAuthProvider;
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    message: "You previously signed in with Google.",
    provider: "GoogleOAuth",
  },
  {
    message: "You previously signed in with GitHub.",
    provider: "GitHubOAuth",
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
