import type { OAuthStrategy } from "@clerk/types";

export type OAuthProviders = {
	strategy: OAuthStrategy;
	message: string;
};

export const OAUTH_PROVIDERS: OAuthProviders[] = [
	{
		strategy: "oauth_google",
		message: "You previously signed in with Google.",
	},
	{
		strategy: "oauth_github",
		message: "You previously signed in with GitHub.",
	},
	{
		strategy: "oauth_apple",
		message: "You previously signed in with Apple.",
	},
];
