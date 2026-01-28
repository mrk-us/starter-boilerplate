/**
 * WorkOS OAuth provider identifiers
 * @see https://workos.com/docs/sso/guide
 */

export type OAuthProviders = {
	provider: "GoogleOAuth" | "GitHubOAuth" | "AppleOAuth" | "MicrosoftOAuth";
	message: string;
};

export const OAUTH_PROVIDERS: OAuthProviders[] = [
	{
		provider: "GoogleOAuth",
		message: "You previously signed in with Google.",
	},
	{
		provider: "GitHubOAuth",
		message: "You previously signed in with GitHub.",
	},
	{
		provider: "AppleOAuth",
		message: "You previously signed in with Apple.",
	},
];
