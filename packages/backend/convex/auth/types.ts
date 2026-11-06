export interface WorkOSUser {
  createdAt: string;
  email: string;
  emailVerified: boolean;
  externalId: string | null;
  firstName: string | null;
  id: string;
  lastName: string | null;
  lastSignInAt: string | null;
  locale: string | null;
  metadata: Record<string, string>;
  name: string | null;
  object: "user";
  profilePictureUrl: string | null;
  updatedAt: string;
}

export type AuthenticateResult =
  | {
      accessToken: string;
      refreshToken: string;
      user: WorkOSUser;
    }
  | {
      authId: string;
      emailVerificationRequired: true;
    };

export interface CheckEmailResult {
  exists: boolean;
  oauthProviders: string[];
}
