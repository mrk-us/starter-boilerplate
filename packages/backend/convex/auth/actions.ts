import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { action } from "../_generated/server";
import {
  AUTH_ERROR_CODE,
  ERROR_CODE,
  ERROR_MESSAGE,
} from "../errors/constants";
import { rateLimiter } from "../rateLimiter";
import { clerk } from "./clerk";
import type { CheckEmailResult } from "./types";
import { checkEmailSchema } from "./validation";

/**
 * Look up an email address before asking for a password
 *
 * The sign-in form is email-first: it needs to know whether the account exists
 * and whether it was created through a social provider, so it can point the
 * user at the right next step instead of failing on a password they never set.
 */
export const checkEmailExists = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<CheckEmailResult> => {
    const validationResult = checkEmailSchema.safeParse({
      email: args.email.toLowerCase().trim(),
    });

    if (!validationResult.success) {
      throw new ConvexError({
        code: ERROR_CODE.INVALID_INPUT,
        message: validationResult.error.issues[0]?.message ?? "Invalid email",
      });
    }

    const { email } = validationResult.data;

    // Rate limit: this endpoint reveals whether an account exists.
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "checkEmail", {
      key: email,
    });

    if (!ok) {
      const hours = Math.ceil(retryAfter / 3_600_000);
      throw new ConvexError({
        code: AUTH_ERROR_CODE.RATE_LIMITED,
        message: `Too many attempts. Please try again in ${hours} ${hours === 1 ? "hour" : "hours"}.`,
      });
    }

    const { data: userList, error: listUsersError } = await tryCatch(
      clerk.users.getUserList({ emailAddress: [email], limit: 1 })
    );

    if (listUsersError) {
      console.error("[checkEmailExists] Clerk lookup failed:", listUsersError);
      throw new ConvexError({
        code: AUTH_ERROR_CODE.GET_USER_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }

    const [user] = userList.data;

    if (!user) {
      return { exists: false, oauthProviders: [] };
    }

    // Clerk reports these as OAuth strategies (`oauth_google`), the same
    // identifiers the sign-in buttons pass to `signIn.sso()`.
    return {
      exists: true,
      oauthProviders: user.externalAccounts.map((account) => account.provider),
    };
  },
});
