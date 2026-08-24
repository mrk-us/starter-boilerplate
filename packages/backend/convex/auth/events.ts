import type { UserJSON } from "@clerk/backend";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { tryCatch } from "@repo/shared";
import { z } from "zod";
import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

/**
 * One-time codes arrive as free-form `data` on `email.created`, so the payload
 * is parsed here instead of being trusted further down the call chain.
 */
const otpEmailSchema = z.object({
  otp_code: z.string().min(1),
});

/**
 * The address Clerk has marked as primary, and only once it is verified
 *
 * `users.email` is what the Stripe customer lookup matches on, so an address
 * nobody has proven ownership of must never reach the table. This mirrors
 * `users.actions.getVerifiedPrimaryEmail`, which reads the camelCase shape.
 */
function getVerifiedPrimaryEmail(user: UserJSON): string | undefined {
  const primary = user.email_addresses.find(
    (emailAddress) => emailAddress.id === user.primary_email_address_id
  );

  return primary?.verification?.status === "verified"
    ? primary.email_address
    : undefined;
}

function getFullName(user: UserJSON): string {
  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || (user.username ?? "");
}

async function syncUser(ctx: ActionCtx, user: UserJSON) {
  const email = getVerifiedPrimaryEmail(user);

  if (!email) {
    console.error(`[clerk] User ${user.id} has no verified primary email`);
    return;
  }

  await ctx.runMutation(internal.users.mutations.syncUserFromAuth, {
    authId: user.id,
    email,
    name: getFullName(user),
    profilePictureUrl: user.image_url,
  });
}

/**
 * Clerk webhook handler
 *
 * Keeps the `users` table in sync with Clerk and, when custom email delivery is
 * enabled in the Clerk dashboard, sends one-time codes through Resend. Clerk
 * retries on non-2xx responses, so every branch has to stay idempotent.
 */
export async function handleClerkEventWebhook(
  ctx: ActionCtx,
  request: Request
): Promise<Response> {
  // Passed explicitly because Clerk's own env lookup falls back to
  // `import.meta`, which the Convex runtime rejects — turning a missing secret
  // into a baffling "import.meta unsupported" error instead of this one.
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!signingSecret) {
    console.error(
      "[clerk] CLERK_WEBHOOK_SIGNING_SECRET is not set in the Convex deployment environment"
    );
    return new Response("Webhook signing secret not configured", {
      status: 500,
    });
  }

  const { data: event, error } = await tryCatch(
    verifyWebhook(request, { signingSecret })
  );

  if (error) {
    console.error("[clerk] Webhook verification failed:", error.message);
    return new Response("Webhook verification failed", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      await syncUser(ctx, event.data);
      break;
    }

    case "user.deleted": {
      // Clerk omits the id when the user was already purged from its side.
      if (event.data.id) {
        await ctx.runAction(internal.users.actions.deleteUserWithSubscription, {
          authId: event.data.id,
        });
      }
      break;
    }

    case "email.created": {
      const { slug, to_email_address: email } = event.data;

      if (!email) {
        break;
      }

      const isOtpEmail =
        slug === "verification_code" || slug === "reset_password_code";

      if (!isOtpEmail) {
        break;
      }

      const otp = otpEmailSchema.safeParse(event.data.data);

      if (!otp.success) {
        console.error(`[clerk] ${slug} email arrived without an otp_code`);
        break;
      }

      // Clerk retries webhooks, so the email id is what makes the delivery
      // idempotent; a resend arrives as a new email with a new id.
      const emailArgs = {
        code: otp.data.otp_code,
        email,
        emailId: event.data.id,
      };

      if (slug === "verification_code") {
        await ctx.runAction(
          internal.emails.actions.sendEmailVerificationEmail,
          emailArgs
        );
      } else {
        await ctx.runAction(
          internal.emails.actions.sendPasswordResetEmail,
          emailArgs
        );
      }
      break;
    }

    default:
      break;
  }

  return new Response("OK", { status: 200 });
}
