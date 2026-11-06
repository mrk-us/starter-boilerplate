import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { convexTest } from "convex-test";
import {
  getReturnPath as getNextReturnPath,
  getSignInDestination as getNextSignInDestination,
} from "../apps/app/features/auth/return-path";
import { api } from "../packages/backend/convex/_generated/api";
import schema from "../packages/backend/convex/schema";
import {
  getReturnPath as getTanStackReturnPath,
  getSignInDestination as getTanStackSignInDestination,
} from "./units/app-tanstack/src/features/auth/return-path";

const modules = {
  "./_generated/server.js": () =>
    import("../packages/backend/convex/_generated/server.js"),
  "./auth/actions.ts": () => import("../packages/backend/convex/auth/actions"),
  "./http.ts": () => import("../packages/backend/convex/http"),
  "./users/mutations.ts": () =>
    import("../packages/backend/convex/users/mutations"),
  "./users/queries.ts": () =>
    import("../packages/backend/convex/users/queries"),
};

const testEnvironment = {
  RESEND_WEBHOOK_SECRET: "whsec_dGVzdF9yZXNlbmRfd2ViaG9vaw==",
  WORKOS_API_KEY: "sk_test_user_sync",
  WORKOS_CLIENT_ID: "client_test_user_sync",
  WORKOS_WEBHOOK_SECRET: "whsec_test_user_sync",
};
const previousEnvironment = Object.fromEntries(
  Object.keys(testEnvironment).map((key) => [key, process.env[key]])
);

const getUser =
  mock<
    (userId: string) => Promise<{
      email: string;
      name: string;
      profilePictureUrl: null;
    }>
  >();

beforeAll(async () => {
  Object.assign(process.env, testEnvironment);
  // AuthKit reads the environment when its module loads.
  const { authKit } = await import("../packages/backend/convex/auth/index");
  spyOn(authKit.workos.userManagement, "getUser").mockImplementation(
    getUser as never
  );
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
  afterEach(() => {
    getUser.mockReset();
  });

  function mockWorkOSUser(id: string, email: string, name: string) {
    getUser.mockImplementation((userId) =>
      userId === id
        ? Promise.resolve({ email, name, profilePictureUrl: null })
        : Promise.reject(new Error(`Unexpected user ${userId}`))
    );
  }

  test("rejects anonymous user lookup and writes", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.query(api.users.queries.userExistsByAuthId, {})
    ).rejects.toThrow("NOT_AUTHENTICATED");
    await expect(
      t.action(api.auth.actions.syncCurrentUser, {})
    ).rejects.toThrow("NOT_AUTHENTICATED");
    expect(getUser).not.toHaveBeenCalled();
  });

  test("creates only the signed-in user's record from their WorkOS profile", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "user_alice" });
    const bob = t.withIdentity({ subject: "user_bob" });
    expect(await alice.query(api.users.queries.userExistsByAuthId, {})).toBe(
      false
    );

    mockWorkOSUser("user_alice", "alice@example.com", "Alice");
    const created = await alice.action(api.auth.actions.syncCurrentUser, {});
    expect(created.created).toBe(true);
    expect(await alice.query(api.users.queries.userExistsByAuthId, {})).toBe(
      true
    );
    expect(await bob.query(api.users.queries.userExistsByAuthId, {})).toBe(
      false
    );

    mockWorkOSUser("user_bob", "bob@example.com", "Bob");
    const bobCreated = await bob.action(api.auth.actions.syncCurrentUser, {});
    expect(bobCreated.userId).not.toBe(created.userId);
    expect(await t.run((ctx) => ctx.db.get(bobCreated.userId))).toMatchObject({
      authId: "user_bob",
      email: "bob@example.com",
      name: "Bob",
    });
  });

  test("leaves an existing record to the WorkOS webhook", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "user_alice" });
    mockWorkOSUser("user_alice", "alice@example.com", "Alice");
    const created = await alice.action(api.auth.actions.syncCurrentUser, {});

    mockWorkOSUser("user_alice", "alice+updated@example.com", "Alice");
    expect(await alice.action(api.auth.actions.syncCurrentUser, {})).toEqual({
      created: false,
      userId: created.userId,
    });
    expect(await t.run((ctx) => ctx.db.get(created.userId))).toMatchObject({
      email: "alice@example.com",
    });
  });
});

describe("webhook signature failures", () => {
  test("Resend returns 400 for an unsigned request", async () => {
    const t = convexTest(schema, modules);
    const response = await t.fetch("/resend/webhooks", {
      body: "{}",
      method: "POST",
    });
    expect(response.status).toBe(400);
  });
});

describe.each([
  [
    "Next",
    {
      getReturnPath: getNextReturnPath,
      getSignInDestination: getNextSignInDestination,
    },
  ],
  [
    "TanStack",
    {
      getReturnPath: getTanStackReturnPath,
      getSignInDestination: getTanStackSignInDestination,
    },
  ],
])(
  "%s sign-in return paths",
  (_framework, { getReturnPath, getSignInDestination }) => {
    test("restores the fragment carried onto sign-in by the browser", () => {
      expect(getSignInDestination("/account?tab=billing", "#plan")).toBe(
        "/account?tab=billing#plan"
      );
      expect(getSignInDestination("/account#profile", "#plan")).toBe(
        "/account#profile"
      );
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
  }
);
