export {};

declare global {
	interface CustomJwtSessionClaims {
		metadata: {
			setupComplete?: boolean;
		};
	}
}
