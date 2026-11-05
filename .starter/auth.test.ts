import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { api } from "../packages/backend/convex/_generated/api";
import schema from "../packages/backend/convex/schema";
import {
  getReturnPath,
  getSignInDestination,
} from "./units/app-tanstack/src/features/auth/return-path";

const modules = {
  "./_generated/server.js": () =>
    import("../packages/backend/convex/_generated/server.js"),
  "./users/mutations.ts": () =>
    import("../packages/backend/convex/users/mutations"),
  "./users/queries.ts": () =>
    import("../packages/backend/convex/users/queries"),
};

const testEnvironment = {
  WORKOS_API_KEY: "sk_test_user_sync",
  WORKOS_CLIENT_ID: "client_test_user_sync",
  WORKOS_WEBHOOK_SECRET: "whsec_test_user_sync",
};
const previousEnvironment = Object.fromEntries(
  Object.keys(testEnvironment).map((key) => [key, process.env[key]])
);

beforeAll(() => {
  Object.assign(process.env, testEnvironment);
});

afterAll(() => {
  for (const [key, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("authenticated user sync", () => {
  test("rejects anonymous user lookup and writes", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.users.queries.userExistsByAuthId, {})
    ).rejects.toThrow("NOT_AUTHENTICATED");
    await expect(
      t.mutation(api.users.mutations.upsertUser, { email: "alice@example.com" })
    ).rejects.toThrow("NOT_AUTHENTICATED");
  });

  test("looks up and updates only the signed-in user's record", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "user_alice" });
    const bob = t.withIdentity({ subject: "user_bob" });
    expect(await alice.query(api.users.queries.userExistsByAuthId, {})).toBe(
      false
    );
    const created = await alice.mutation(api.users.mutations.upsertUser, {
      email: "alice@example.com",
      name: "Alice",
    });
    expect(created.created).toBe(true);
    expect(await alice.query(api.users.queries.userExistsByAuthId, {})).toBe(
      true
    );
    expect(await bob.query(api.users.queries.userExistsByAuthId, {})).toBe(
      false
    );
    const bobCreated = await bob.mutation(api.users.mutations.upsertUser, {
      email: "bob@example.com",
      name: "Bob",
    });
    expect(bobCreated.userId).not.toBe(created.userId);
    const updated = await alice.mutation(api.users.mutations.upsertUser, {
      email: "alice+updated@example.com",
    });
    expect(updated).toEqual({ created: false, userId: created.userId });
    expect(await t.run((ctx) => ctx.db.get(bobCreated.userId))).toMatchObject({
      authId: "user_bob",
      email: "bob@example.com",
      name: "Bob",
    });
  });
});

describe("sign-in return paths", () => {
  test("restores the fragment carried onto sign-in by the browser", () => {
    expect(getSignInDestination("/account?tab=billing", "#plan")).toBe(
      "/account?tab=billing#plan"
    );
    expect(getSignInDestination("/account#profile", "#plan")).toBe(
      "/account#profile"
    );
    expect(getSignInDestination(undefined, "#plan")).toBe("/");
  });

  test.each([
    "/",
    "/account#profile",
    "/account?tab=billing#plan",
    "/account%23literal?next=%2F#profile",
  ])("preserves %s", (path) => {
    expect(getReturnPath(path)).toBe(path);
    const destination = new URL(
      getReturnPath(path),
      "https://app.example/callback?code=secret&state=sealed"
    );
    expect(
      `${destination.pathname}${destination.search}${destination.hash}`
    ).toBe(path);
  });

  test.each([
    undefined,
    null,
    {},
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "javascript:alert(1)",
  ])("rejects external or invalid destination %p", (path) => {
    expect(getReturnPath(path)).toBe("/");
  });
});
