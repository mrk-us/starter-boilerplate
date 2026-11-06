import { afterAll, afterEach, describe, expect, spyOn, test } from "bun:test";
import { convexTest } from "convex-test";
import { getAuthenticatedUser } from "../packages/backend/convex/auth/helpers";
import schema from "../packages/backend/convex/schema";
import { parseAppError } from "../packages/shared/src/utils/parse-errors";

const consoleError = spyOn(console, "error").mockImplementation(
  () => undefined
);

afterEach(() => {
  consoleError.mockClear();
});

afterAll(() => {
  consoleError.mockRestore();
});

describe("parseAppError", () => {
  test.each([
    "[CONVEX A(billing/actions:generateCheckoutLink)] [Request ID: ef34] Server Error Uncaught Error: Stripe failed at handler (../convex/billing/actions.ts:40:7)",
    "[Request ID: ef34] Server Error",
  ])("hides a Convex server failure: %s", (message) => {
    const error = new Error(message);

    expect(parseAppError(error).code).toBe("UNKNOWN");
    expect(parseAppError(error).message).not.toContain("Request ID");
    expect(consoleError).toHaveBeenCalledWith(error);
  });

  test("keeps a ConvexError relayed by the HTTP client", () => {
    const error = new Error(
      '[Request ID: ef34] Server Error\nUncaught ConvexError: {"code":"RATE_LIMITED","message":"Too many attempts."}'
    );

    expect(parseAppError(error)).toEqual({
      code: "RATE_LIMITED",
      message: "Too many attempts.",
    });
  });

  test("keeps the code and message of other errors", () => {
    const error = Object.assign(new Error("Email must be verified."), {
      code: "email_verification_required",
    });

    expect(parseAppError(error)).toEqual({
      code: "email_verification_required",
      message: "Email must be verified.",
    });
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("getAuthenticatedUser", () => {
  test("finds the app user when the WorkOS webhook did not arrive", async () => {
    const t = convexTest(schema, {
      "./_generated/server.js": () =>
        import("../packages/backend/convex/_generated/server.js"),
    });
    await t.run((ctx) =>
      ctx.db.insert("users", {
        authId: "user_no_webhook",
        email: "no-webhook@example.com",
        name: "",
        profilePictureUrl: "",
        setupComplete: false,
      })
    );

    const user = await t
      .withIdentity({ subject: "user_no_webhook" })
      .run((ctx) => getAuthenticatedUser(ctx));

    expect(user?.email).toBe("no-webhook@example.com");
  });
});
