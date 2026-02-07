/**
 * WorkOS OAuth provider identifiers and messages
 * @see https://workos.com/docs/sso/guide
 */

export type OAuthProvider = "GoogleOAuth" | "GitHubOAuth";

export type OAuthProviderConfig = {
	provider: OAuthProvider;
	message: string;
};

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
	{
		provider: "GoogleOAuth",
		message: "You previously signed in with Google.",
	},
	{
		provider: "GitHubOAuth",
		message: "You previously signed in with GitHub.",
	},
];
