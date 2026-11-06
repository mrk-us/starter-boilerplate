import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { internal } from "../packages/backend/convex/_generated/api";
import { getOAuthSignInHint } from "../packages/backend/convex/auth/oauth";
import schema from "../packages/backend/convex/schema";

const testEnvironment = {
  WORKOS_API_KEY: "sk_test_email",
  WORKOS_CLIENT_ID: "client_test_email",
  WORKOS_WEBHOOK_SECRET: "secret_test_email",
};

const originalEnvironment = Object.fromEntries(
  Object.keys(testEnvironment).map((key) => [key, process.env[key]])
);

const modules = {
  "./_generated/server.js": () =>
    import("../packages/backend/convex/_generated/server.js"),
  "./users/mutations.ts": () =>
    import("../packages/backend/convex/users/mutations"),
};

beforeAll(() => {
  Object.assign(process.env, testEnvironment);
});

afterAll(() => {
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("completeSetupInternal", () => {
  test("schedules one welcome email when setup runs twice", async () => {
    const t = convexTest(schema, modules);
    const authId = "user_setup_twice";
    await t.run((ctx) =>
      ctx.db.insert("users", {
        authId,
        email: "setup@example.com",
        name: "",
        setupComplete: false,
      })
    );

    const complete = (name: string) =>
      t.mutation(internal.users.mutations.completeSetupInternal, {
        authId,
        name,
      });

    expect(await complete("First")).toEqual({ success: true });
    expect(await complete("Second")).toEqual({ success: true });

    const scheduled = await t.run((ctx) =>
      ctx.db.system.query("_scheduled_functions").collect()
    );
    expect(scheduled).toHaveLength(1);

    const user = await t.run((ctx) =>
      ctx.db
        .query("users")
        .withIndex("authId", (q) => q.eq("authId", authId))
        .unique()
    );
    expect(user?.name).toBe("Second");
  });

  test("reports a missing user", async () => {
    const t = convexTest(schema, modules);

    expect(
      await t.mutation(internal.users.mutations.completeSetupInternal, {
        authId: "user_missing",
        name: "Missing",
      })
    ).toEqual({ success: false });
  });
});

describe("getOAuthSignInHint", () => {
  test("returns no hint for a password-only account", () => {
    expect(getOAuthSignInHint([])).toBeUndefined();
  });

  test("offers the Google button to a Google account", () => {
    expect(getOAuthSignInHint(["GoogleOAuth"])).toBe(
      `You previously signed in with Google. If you don't have a password, use "Continue with Google" or use "Forgot password?" to set one.`
    );
  });

  test("offers only the password reset to a provider without a button", () => {
    expect(getOAuthSignInHint(["MicrosoftOAuth"])).toBe(
      `You previously signed in with Microsoft. If you don't have a password, use "Forgot password?" to set one.`
    );
  });

  test("names every provider once", () => {
    expect(
      getOAuthSignInHint(["GoogleOAuth", "GoogleOAuth", "SomethingNew"])
    ).toContain("Google and another provider");
  });
});
