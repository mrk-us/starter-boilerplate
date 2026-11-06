const OAUTH_PROVIDER_NAMES: Record<string, string> = {
  AppleOAuth: "Apple",
  GitHubOAuth: "GitHub",
  GoogleOAuth: "Google",
  MicrosoftOAuth: "Microsoft",
};

/**
 * Describe the ways to sign in to an account that has OAuth identities. WorkOS
 * does not say if the account also has a password, so the password step stays
 * available. Google is the only OAuth button in the sign-in form.
 */
export function getOAuthSignInHint(providers: string[]): string | undefined {
  if (providers.length === 0) {
    return undefined;
  }

  const names = new Set(
    providers.map(
      (provider) => OAUTH_PROVIDER_NAMES[provider] ?? "another provider"
    )
  );
  const googleOption = providers.includes("GoogleOAuth")
    ? 'use "Continue with Google" or '
    : "";

  return `You previously signed in with ${[...names].join(" and ")}. If you don't have a password, ${googleOption}use "Forgot password?" to set one.`;
}
