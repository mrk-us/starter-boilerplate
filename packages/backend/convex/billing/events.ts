import type { StripeEventHandlers } from "@convex-dev/stripe";
import { ConvexError } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ERROR_MESSAGE, USER_ERROR_CODE } from "../errors/constants";
import { STRIPE_PRICE_LOOKUP_KEY } from "./constants";

/**
 * Stripe webhook event handlers
 *
 * These handlers are called when Stripe sends webhook events.
 * Add custom logic here to handle subscription lifecycle events.
 *
 *  Required events in Stripe Dashboard:
 * - checkout.session.completed
 * - customer.created
 * - customer.updated
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.created
 * - invoice.finalized
 * - invoice.paid
 * - invoice.payment_failed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 */
export const stripeEventHandlers: StripeEventHandlers = {
	"customer.subscription.created": async (ctx, event) => {
		const subscription = event.data.object;

		const proPlan =
			subscription.metadata.priceLookupKey ===
				STRIPE_PRICE_LOOKUP_KEY.PRO_MONTHLY ||
			subscription.metadata.priceLookupKey ===
				STRIPE_PRICE_LOOKUP_KEY.PRO_YEARLY;

		// Only send welcome email for Pro subscriptions
		if (proPlan) {
			// Fetch user details
			const user = await ctx.runQuery(internal.users.queries.getUserById, {
				userId: subscription.metadata.userId as Id<"users">,
			});

			if (!user) {
				throw new ConvexError({
					code: USER_ERROR_CODE.USER_NOT_FOUND,
					message: ERROR_MESSAGE.USER_NOT_FOUND,
				});
			}

			// Send welcome to Pro email
			await ctx.runAction(internal.emails.actions.sendWelcomeToProEmail, {
				email: user.email,
				name: user.name,
			});
		}
	},

	"customer.subscription.updated": async (_ctx, event) => {
		const subscription = event.data.object;
		if (subscription.cancel_at_period_end) {
			console.log(
				"Subscription set to cancel:",
				subscription.id,
				"at",
				new Date(subscription.current_period_end * 1000).toISOString(),
			);
		}
	},

	"customer.subscription.deleted": async (_ctx, event) => {
		console.log("Subscription cancelled:", event.data.object.id);
	},
};

/**
 * Called for ALL Stripe events - useful for logging/analytics
 */
export async function onStripeEvent(
	_ctx: unknown,
	event: { type: string },
): Promise<void> {
	console.log("Stripe event received:", event.type);
}
