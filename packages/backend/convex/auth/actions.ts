import { isDisposableEmail } from "disposable-email-domains-js";
import { authKit } from "./index";

export const { authKitAction } = authKit.actions({
	// Allow/deny user registration
	userRegistration: async (_ctx, _action, response) => {
		// Check if the email is a disposable email
		if (isDisposableEmail(_action.userData.email)) {
			return response.deny("Temporary email addresses are not allowed");
		}
		await Promise.resolve();
		return response.allow();
	},

	// Allow/deny authentication
	authentication: async (_ctx, _action, response) => {
		// TODO: Implement authentication logic
		await Promise.resolve();
		return response.allow();
	},
});
