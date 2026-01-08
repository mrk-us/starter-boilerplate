export type { AuthErrorCode } from "./constants";

export type WorkOSUser = {
	object: "user";
	id: string;
	email: string;
	emailVerified: boolean;
	profilePictureUrl: string | null;
	firstName: string | null;
	lastName: string | null;
	lastSignInAt: string | null;
	createdAt: string;
	updatedAt: string;
	externalId: string | null;
	metadata: Record<string, string>;
	locale: string | null;
};

export type AuthenticateResult = {
	accessToken: string;
	refreshToken: string;
	user: WorkOSUser;
};
