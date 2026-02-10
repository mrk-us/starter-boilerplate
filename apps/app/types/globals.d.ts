export {};

declare global {
	interface CustomJwtSessionClaims {
		metadata: {
			setupComplete?: boolean;
		};
	}

	interface Window {
		electron?: {
			openExternal: (url: string) => Promise<void>;
		};
	}
}
