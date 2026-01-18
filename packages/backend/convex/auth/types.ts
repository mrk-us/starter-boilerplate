/**
 * Type for Clerk user identity from JWT
 */
export type ClerkIdentity = {
	subject: string;
	email?: string;
	emailVerified?: boolean;
	name?: string;
	pictureUrl?: string;
};

/**
 * Clerk webhook event types we handle
 */
export type ClerkUserEvent = {
	data: {
		id: string;
		email_addresses: Array<{
			id: string;
			email_address: string;
			verification: { status: string } | null;
		}>;
		primary_email_address_id: string | null;
		first_name: string | null;
		last_name: string | null;
		image_url: string | null;
		public_metadata: {
			onboardingComplete?: boolean;
		};
	};
	type: "user.created" | "user.updated" | "user.deleted";
};

/**
 * Clerk email webhook event
 */
export type ClerkEmailEvent = {
	data: {
		id: string;
		slug: string;
		to_email_address: string;
		data: {
			otp_code?: string;
			[key: string]: unknown;
		};
	};
	type: "email.created";
};

export type ClerkWebhookEvent = ClerkUserEvent | ClerkEmailEvent;
