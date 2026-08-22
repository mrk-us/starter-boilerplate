import { vOnEmailEventArgs } from "@convex-dev/resend";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

/**
 * Handle Resend webhook events
 */
export const handleResendEventWebhook = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, args) => {
    switch (args.event.type) {
      case "email.failed": {
        const eventData = args.event.data as { failed?: { reason?: string } };
        console.error("Email failed:", {
          emailId: args.id,
          reason: eventData.failed?.reason ?? "Unknown",
          subject: args.event.data.subject,
          to: args.event.data.to,
        });

        const user = await ctx.runQuery(internal.users.queries.getUserByEmail, {
          email: args.event.data.to,
        });
        if (user) {
          console.error("Failed to send email to user:", user._id);
        }
        break;
      }

      case "email.bounced": {
        console.warn("Email bounced:", {
          emailId: args.id,
          subject: args.event.data.subject,
          to: args.event.data.to,
        });

        const user = await ctx.runQuery(internal.users.queries.getUserByEmail, {
          email: args.event.data.to,
        });
        if (user) {
          console.error("Email bounced for user:", {
            email: user.email,
            userId: user._id,
          });
        }
        break;
      }

      case "email.complained": {
        console.warn("Email marked as spam:", {
          emailId: args.id,
          subject: args.event.data.subject,
          to: args.event.data.to,
        });

        const user = await ctx.runQuery(internal.users.queries.getUserByEmail, {
          email: args.event.data.to,
        });
        if (user) {
          console.error("Spam complaint from user:", {
            email: user.email,
            userId: user._id,
          });
        }
        break;
      }

      case "email.delivered": {
        // Delivered events are expected and high-volume; avoid noisy logging.
        break;
      }

      default: {
        // Handle any other event types
        break;
      }
    }
  },
});
