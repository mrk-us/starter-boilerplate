import { tryCatch } from "@repo/shared";
import { ConvexError, v } from "convex/values";
import { isDisposableEmail } from "disposable-email-domains-js";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import { action, internalAction } from "../_generated/server";
import { ERROR_CODE, ERROR_MESSAGE } from "../errors/constants";
import { rateLimiter } from "../rateLimiter";
import { AUTH_ERROR_CODE } from "./constants";
import { requireAuthId } from "./helpers";
import { authKit } from "./index";
import type { AuthenticateResult, CheckEmailResult } from "./types";
import { checkEmailSchema } from "./validation";

/**
 * AuthKit action handler (required by WorkOS AuthKit component)
 */
export const { authKitAction } = authKit.actions({
  authentication: async (_ctx, _action, response) => response.allow(),
  userRegistration: async (_ctx, _action, response) => response.allow(),
});

/**
 * Create the signed-in user's record from their WorkOS profile.
 * The profile comes from WorkOS because billing and emails trust this email,
 * so a client must not be able to choose it.
 */
export const syncCurrentUser = action({
  args: {},
  handler: async (ctx): Promise<{ created: boolean; userId: Id<"users"> }> => {
    const authId = await requireAuthId(ctx);
    const user = await authKit.workos.userManagement.getUser(authId);

    return await ctx.runMutation(internal.users.mutations.createUserIfMissing, {
      authId,
      email: user.email,
      name: user.name ?? user.firstName ?? "",
      profilePictureUrl: user.profilePictureUrl ?? undefined,
    });
  },
  returns: v.object({ created: v.boolean(), userId: v.id("users") }),
});

/**
 * Create user account with email and password
 */
export const createUserAccount = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Rate limit
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "signUp", {
      key: email,
    });

    if (!ok) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.RATE_LIMITED,
        message: `Too many sign-up attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
      });
    }

    // Check for disposable email
    if (isDisposableEmail(email)) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.DISPOSABLE_EMAIL,
        message: "Temporary email addresses are not allowed",
      });
    }

    // Create user in WorkOS
    const { data: createUserData, error: createUserError } = await tryCatch(
      authKit.workos.userManagement.createUser({
        email,
        password: args.password,
      })
    );

    if (createUserError) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.CREATE_USER_FAILED,
        message: createUserError.message,
      });
    }

    // The account now exists, so a failed send must not fail sign-up. The verify
    // page can send the email again.
    if (!createUserData.emailVerified) {
      const { error: sendEmailError } = await tryCatch(
        authKit.workos.userManagement.sendVerificationEmail({
          userId: createUserData.id,
        })
      );

      if (sendEmailError) {
        console.error(
          "Failed to send verification email:",
          sendEmailError.message
        );
      }
    }

    return {
      emailVerified: createUserData.emailVerified,
      id: createUserData.id,
    };
  },
});

/**
 * Verify email with code
 */
export const verifyEmail = action({
  args: {
    authId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limit: the code has only 6 digits
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "verifyEmail", {
      key: args.authId,
    });

    if (!ok) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.RATE_LIMITED,
        message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
      });
    }

    const { error: verifyEmailError } = await tryCatch(
      authKit.workos.userManagement.verifyEmail({
        code: args.code,
        userId: args.authId,
      })
    );

    if (verifyEmailError) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.EMAIL_VERIFICATION_FAILED,
        message: verifyEmailError.message,
      });
    }

    return { success: true };
  },
});

/**
 * Check if email exists in WorkOS and get OAuth providers
 */
export const checkEmailExists = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<CheckEmailResult> => {
    // Validate input
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

    // Anyone can spend this email's tokens, so an exhausted limit must not block
    // sign-in. Skip the lookup and continue to the password step.
    const { ok } = await rateLimiter.limit(ctx, "checkEmail", {
      key: email,
    });

    if (!ok) {
      return { exists: true, oauthProviders: [] };
    }

    // Check if user exists in WorkOS
    const { data: listUsersData, error: listUsersError } = await tryCatch(
      authKit.workos.userManagement.listUsers({ email })
    );

    if (listUsersError) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.GET_USER_FAILED,
        message: listUsersError.message,
      });
    }

    const [user] = listUsersData.data;

    // User doesn't exist
    if (!user) {
      return { exists: false, oauthProviders: [] };
    }

    // Get user's OAuth identities
    const { data: identitiesData, error: identitiesError } = await tryCatch(
      authKit.workos.userManagement.getUserIdentities(user.id)
    );

    if (identitiesError) {
      // If we can't get identities, still return that user exists
      // but with empty OAuth providers
      return { exists: true, oauthProviders: [] };
    }

    // Extract OAuth provider names
    const oauthProviders = identitiesData
      .filter((identity) => identity.type === "OAuth")
      .map((identity) => identity.provider);

    return { exists: true, oauthProviders };
  },
});

/**
 * Send verification email (shared logic)
 */
async function sendVerificationEmail(ctx: ActionCtx, authId: string) {
  const authUser = await authKit.getAuthUser(ctx);

  // Prevent sending verification emails for other users
  if (authUser && authUser.id !== authId) {
    throw new ConvexError({
      code: AUTH_ERROR_CODE.UNAUTHORIZED,
      message: ERROR_MESSAGE.UNAUTHORIZED,
    });
  }

  // Rate limit per minute
  const perMinute = await rateLimiter.limit(ctx, "resendEmailVerification", {
    key: authId,
  });

  if (!perMinute.ok) {
    throw new ConvexError({
      code: AUTH_ERROR_CODE.RATE_LIMITED,
      message: `Too many attempts. Please try again in ${Math.ceil(perMinute.retryAfter / 1000)} seconds.`,
    });
  }

  // Rate limit per hour
  const perHour = await rateLimiter.limit(
    ctx,
    "resendEmailVerificationMaxAttempts",
    { key: authId }
  );

  if (!perHour.ok) {
    throw new ConvexError({
      code: AUTH_ERROR_CODE.RATE_LIMITED,
      message: `Too many attempts. Please try again in ${Math.ceil(perHour.retryAfter / 60_000)} minutes.`,
    });
  }

  // Send verification email
  const { error: sendVerificationEmailError } = await tryCatch(
    authKit.workos.userManagement.sendVerificationEmail({
      userId: authId,
    })
  );

  if (sendVerificationEmailError) {
    throw new ConvexError({
      code: AUTH_ERROR_CODE.SEND_VERIFICATION_EMAIL_FAILED,
      message: sendVerificationEmailError.message,
    });
  }
}

/**
 * Resend verification email
 */
export const resendVerificationEmail = action({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    await sendVerificationEmail(ctx, args.authId);
    return { success: true };
  },
});

/**
 * Resend verification email on email change (internal)
 */
export const resendVerificationEmailOnEmailChange = internalAction({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    await sendVerificationEmail(ctx, args.authId);
    return { success: true };
  },
});

/**
 * Authenticate with email and password
 */
export const authenticateWithPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<AuthenticateResult> => {
    const email = args.email.toLowerCase().trim();

    // Rate limit
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "signIn", {
      key: email,
    });

    if (!ok) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.RATE_LIMITED,
        message: `Too many attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} ${Math.ceil(retryAfter / 60_000) === 1 ? "minute" : "minutes"}.`,
      });
    }

    const clientId = process.env.WORKOS_CLIENT_ID;

    if (!clientId) {
      console.error("WORKOS_CLIENT_ID environment variable is not set");
      throw new ConvexError({
        code: AUTH_ERROR_CODE.AUTHENTICATION_FAILED,
        message: ERROR_MESSAGE.UNKNOWN,
      });
    }

    // Authenticate with WorkOS
    const { data: authResponseData, error: authResponseError } = await tryCatch(
      authKit.workos.userManagement.authenticateWithPassword({
        clientId,
        email,
        password: args.password,
      })
    );

    // The verify page needs the user id, and the WorkOS error is reduced to its
    // code and message here
    if (authResponseError?.code === "email_verification_required") {
      const { data: listUsersData } = await tryCatch(
        authKit.workos.userManagement.listUsers({ email })
      );
      const [user] = listUsersData?.data ?? [];

      if (user) {
        return { authId: user.id, emailVerificationRequired: true };
      }
    }

    if (authResponseError) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.AUTHENTICATION_FAILED,
        message: authResponseError.message,
      });
    }

    return {
      accessToken: authResponseData.accessToken,
      refreshToken: authResponseData.refreshToken,
      user: {
        createdAt: authResponseData.user.createdAt,
        email: authResponseData.user.email,
        emailVerified: authResponseData.user.emailVerified,
        externalId: authResponseData.user.externalId,
        firstName: authResponseData.user.firstName,
        id: authResponseData.user.id,
        lastName: authResponseData.user.lastName,
        lastSignInAt: authResponseData.user.lastSignInAt,
        locale: authResponseData.user.locale,
        metadata: authResponseData.user.metadata as Record<string, string>,
        name: authResponseData.user.name,
        object: "user" as const,
        profilePictureUrl: authResponseData.user.profilePictureUrl,
        updatedAt: authResponseData.user.updatedAt,
      },
    };
  },
});

function passwordResetFailed() {
  return new ConvexError({
    code: AUTH_ERROR_CODE.SEND_PASSWORD_RESET_FAILED,
    message: "We couldn't send the reset email. Please try again.",
  });
}

/**
 * Request password reset email
 */
export const requestPasswordReset = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Rate limit
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "passwordReset", {
      key: email,
    });

    if (!ok) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.RATE_LIMITED,
        message: `Too many password reset attempts. Please try again in ${Math.ceil(retryAfter / 60_000)} minutes.`,
      });
    }

    const { data: listUsersData, error: listUsersError } = await tryCatch(
      authKit.workos.userManagement.listUsers({ email })
    );

    if (listUsersError) {
      console.error("Failed to look up reset email:", listUsersError.message);
      throw passwordResetFailed();
    }

    // An unknown email gets the same response as a known email
    if (listUsersData.data.length === 0) {
      return { success: true };
    }

    const { error: createPasswordResetError } = await tryCatch(
      authKit.workos.userManagement.createPasswordReset({ email })
    );

    if (createPasswordResetError) {
      console.error(
        "Failed to create password reset:",
        createPasswordResetError.message
      );
      throw passwordResetFailed();
    }

    return { success: true };
  },
});

/**
 * Reset password with token
 */
export const resetPasswordWithToken = action({
  args: {
    newPassword: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, args) => {
    const { error: resetPasswordError } = await tryCatch(
      authKit.workos.userManagement.resetPassword({
        newPassword: args.newPassword,
        token: args.token,
      })
    );

    if (resetPasswordError) {
      throw new ConvexError({
        code: AUTH_ERROR_CODE.RESET_PASSWORD_FAILED,
        message: resetPasswordError.message,
      });
    }

    return { success: true };
  },
});
