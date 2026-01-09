import { type AuthFunctions, AuthKit } from "@convex-dev/workos-authkit";
import { components, internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";

const authFunctions: AuthFunctions = {
	authKitAction: internal.auth.actions.authKitAction,
	authKitEvent: internal.auth.events.authKitEvent,
};

/**
 * Initialize AuthKit component
 */
export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
	authFunctions,
	additionalEventTypes: [
		"session.created",
		"invitation.created",
		"password_reset.created",
		"magic_auth.created",
		"email_verification.created",
	],
});
