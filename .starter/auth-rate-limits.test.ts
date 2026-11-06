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
import { api } from "../packages/backend/convex/_generated/api";
import {
  createClientProof,
  createVerifyToken,
} from "../packages/backend/convex/auth/proofs";
import { rateLimiter } from "../packages/backend/convex/rateLimiter";
import schema from "../packages/backend/convex/schema";

const modules = {
  "./_generated/server.js": () =>
    import("../packages/backend/convex/_generated/server.js"),
  "./auth/actions.ts": () => import("../packages/backend/convex/auth/actions"),
};

const EMAIL = "victim@example.com";
const PASSWORD = "Correct-Horse-9";
const ADDRESS = "203.0.113.5";

const testEnvironment = {
  RESEND_WEBHOOK_SECRET: "whsec_dGVzdF9yZXNlbmRfd2ViaG9vaw==",
  WORKOS_API_KEY: "sk_test_rate_limits",
  WORKOS_CLIENT_ID: "client_test_rate_limits",
  WORKOS_WEBHOOK_SECRET: "whsec_test_rate_limits",
};
const previousEnvironment = Object.fromEntries(
  Object.keys(testEnvironment).map((key) => [key, process.env[key]])
);

const workos = {
  authenticateWithPassword: mock(),
  createPasswordReset: mock(() => Promise.resolve({})),
  createUser: mock(() =>
    Promise.resolve({ emailVerified: false, id: "user_new" })
  ),
  getUserIdentities: mock(() => Promise.resolve([])),
  listUsers: mock(() => Promise.resolve({ data: [{ id: "user_victim" }] })),
  sendVerificationEmail: mock(() => Promise.resolve({})),
};
const limitCalls: { key?: string; name: string }[] = [];
let exhausted: string[] = [];

function rateLimitResult(name: string) {
  return Promise.resolve(
    exhausted.includes(name)
      ? { ok: false as const, retryAfter: 60_000 }
      : { ok: true as const, retryAfter: undefined }
  );
}

beforeAll(async () => {
  Object.assign(process.env, testEnvironment);
  // AuthKit reads the environment when its module loads.
  const { authKit } = await import("../packages/backend/convex/auth/index");

  for (const [name, implementation] of Object.entries(workos)) {
    spyOn(
      authKit.workos.userManagement,
      name as keyof typeof workos
    ).mockImplementation(implementation as never);
  }

  spyOn(rateLimiter, "limit").mockImplementation(((
    _ctx: unknown,
    name: string,
    options?: { key?: string }
  ) => {
    limitCalls.push({ key: options?.key, name });
    return rateLimitResult(name);
  }) as never);
  spyOn(rateLimiter, "check").mockImplementation(((
    _ctx: unknown,
    name: string
  ) => rateLimitResult(name)) as never);
});

afterEach(() => {
  exhausted = [];
  limitCalls.length = 0;
  for (const implementation of Object.values(workos)) {
    implementation.mockClear();
  }
  workos.authenticateWithPassword.mockReset();
});

afterAll(() => {
  mock.restore();
  for (const [key, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

function limitNames() {
  return limitCalls.map(({ name }) => name);
}

describe("createClientProof", () => {
  test("uses the entry from the nearest proxy, not one the client wrote", async () => {
    const { address } = await createClientProof(`198.51.100.9, ${ADDRESS}`);
    expect(address).toBe(ADDRESS);
  });
});

describe("calls that skip the app server", () => {
  const anonymousActions = [
    [
      "authenticateWithPassword",
      api.auth.actions.authenticateWithPassword,
      { email: EMAIL, password: PASSWORD },
    ],
    ["checkEmailExists", api.auth.actions.checkEmailExists, { email: EMAIL }],
    [
      "createUserAccount",
      api.auth.actions.createUserAccount,
      { email: EMAIL, password: PASSWORD },
    ],
    [
      "requestPasswordReset",
      api.auth.actions.requestPasswordReset,
      { email: EMAIL },
    ],
  ] as const;

  test.each(anonymousActions)(
    "%s rejects a forged proof",
    async (_, fn, args) => {
      const t = convexTest(schema, modules);
      await expect(
        t.action(
          fn as never,
          {
            ...args,
            clientProof: { address: ADDRESS, proof: "00ff" },
          } as never
        )
      ).rejects.toThrow("UNAUTHORIZED");
      expect(limitCalls).toEqual([]);
      expect(workos.listUsers).not.toHaveBeenCalled();
      expect(workos.createUser).not.toHaveBeenCalled();
      expect(workos.authenticateWithPassword).not.toHaveBeenCalled();
    }
  );

  test("rejects a proof signed for another address", async () => {
    const t = convexTest(schema, modules);
    const { proof } = await createClientProof("198.51.100.9");
    await expect(
      t.action(api.auth.actions.checkEmailExists, {
        clientProof: { address: ADDRESS, proof },
        email: EMAIL,
      })
    ).rejects.toThrow("UNAUTHORIZED");
  });
});

describe("per-client limits", () => {
  test("a client out of reset tokens spends no tokens of the email", async () => {
    const t = convexTest(schema, modules);
    exhausted = ["passwordResetByClient"];
    const clientProof = await createClientProof(ADDRESS);
    await expect(
      t.action(api.auth.actions.requestPasswordReset, {
        clientProof,
        email: EMAIL,
      })
    ).rejects.toThrow("Too many password reset attempts");
    expect(limitCalls).toEqual([
      { key: clientProof.proof, name: "passwordResetByClient" },
    ]);
    expect(workos.createPasswordReset).not.toHaveBeenCalled();
  });

  test("a client out of check tokens continues to the password step with no lookup", async () => {
    const t = convexTest(schema, modules);
    exhausted = ["checkEmailByClient"];
    expect(
      await t.action(api.auth.actions.checkEmailExists, {
        clientProof: await createClientProof(ADDRESS),
        email: EMAIL,
      })
    ).toEqual({ exists: true, oauthProviders: [] });
    expect(limitNames()).toEqual(["checkEmailByClient"]);
    expect(workos.listUsers).not.toHaveBeenCalled();
  });

  test("with no address, visitors do not share a client bucket", async () => {
    const t = convexTest(schema, modules);
    await t.action(api.auth.actions.checkEmailExists, {
      clientProof: await createClientProof(null),
      email: EMAIL,
    });
    expect(limitNames()).toEqual(["checkEmail"]);
  });
});

describe("sign-in lockout", () => {
  const signedInUser = {
    accessToken: "access",
    refreshToken: "refresh",
    user: { email: EMAIL, emailVerified: true, id: "user_victim" },
  };

  test("a correct password spends no tokens of the email", async () => {
    const t = convexTest(schema, modules);
    workos.authenticateWithPassword.mockResolvedValue(signedInUser);
    await t.action(api.auth.actions.authenticateWithPassword, {
      clientProof: await createClientProof(ADDRESS),
      email: EMAIL,
      password: PASSWORD,
    });
    expect(limitNames()).toEqual(["signInByClient"]);
  });

  test("a wrong password spends one token of the email", async () => {
    const t = convexTest(schema, modules);
    workos.authenticateWithPassword.mockRejectedValue(
      new Error("Invalid credentials")
    );
    await expect(
      t.action(api.auth.actions.authenticateWithPassword, {
        clientProof: await createClientProof(ADDRESS),
        email: EMAIL,
        password: "wrong",
      })
    ).rejects.toThrow("Invalid credentials");
    expect(limitCalls).toContainEqual({ key: EMAIL, name: "signIn" });
  });

  test("a locked email stops before the password check", async () => {
    const t = convexTest(schema, modules);
    exhausted = ["signIn"];
    await expect(
      t.action(api.auth.actions.authenticateWithPassword, {
        clientProof: await createClientProof(ADDRESS),
        email: EMAIL,
        password: PASSWORD,
      })
    ).rejects.toThrow("Too many attempts");
    expect(workos.authenticateWithPassword).not.toHaveBeenCalled();
  });
});

describe("resending the verification email", () => {
  test("sign-up returns a token that resend accepts", async () => {
    const t = convexTest(schema, modules);
    const { id, verifyToken } = await t.action(
      api.auth.actions.createUserAccount,
      {
        clientProof: await createClientProof(ADDRESS),
        email: "new@example.com",
        password: PASSWORD,
      }
    );
    workos.sendVerificationEmail.mockClear();

    await t.action(api.auth.actions.resendVerificationEmail, {
      authId: id,
      token: verifyToken,
    });
    expect(workos.sendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  test("sign-in with an unverified email returns the token", async () => {
    const t = convexTest(schema, modules);
    workos.authenticateWithPassword.mockRejectedValue(
      Object.assign(new Error("Email not verified"), {
        code: "email_verification_required",
      })
    );
    expect(
      await t.action(api.auth.actions.authenticateWithPassword, {
        clientProof: await createClientProof(ADDRESS),
        email: EMAIL,
        password: PASSWORD,
      })
    ).toEqual({
      authId: "user_victim",
      emailVerificationRequired: true,
      verifyToken: await createVerifyToken("user_victim"),
    });
  });

  test.each([
    ["no token", ""],
    ["a wrong token", "00ff"],
  ])("rejects %s", async (_, token) => {
    const t = convexTest(schema, modules);
    await expect(
      t.action(api.auth.actions.resendVerificationEmail, {
        authId: "user_victim",
        token,
      })
    ).rejects.toThrow("UNAUTHORIZED");
    expect(workos.sendVerificationEmail).not.toHaveBeenCalled();
  });

  test("rejects the token of another account", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.action(api.auth.actions.resendVerificationEmail, {
        authId: "user_victim",
        token: await createVerifyToken("user_attacker"),
      })
    ).rejects.toThrow("UNAUTHORIZED");
    expect(workos.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
