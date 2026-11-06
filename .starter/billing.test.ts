import { describe, expect, test } from "bun:test";
import { convexTest } from "convex-test";
import { internal } from "../packages/backend/convex/_generated/api";
import { getSubscriptionStatusForUser } from "../packages/backend/convex/billing/helpers";
import schema from "../packages/backend/convex/schema";

const modules = {
  "./_generated/server.js": () =>
    import("../packages/backend/convex/_generated/server.js"),
  "./billing/mutations.ts": () =>
    import("../packages/backend/convex/billing/mutations"),
};

function scheduledEmails(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
}

describe("welcome to Pro email", () => {
  test("is scheduled once for each subscription", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run((ctx) =>
      ctx.db.insert("users", {
        authId: "user_welcome",
        email: "welcome@example.com",
        name: "Welcome User",
      })
    );
    const send = (stripeSubscriptionId: string) =>
      t.mutation(internal.billing.mutations.sendProWelcomeEmailOnce, {
        stripeSubscriptionId,
        userId,
      });

    await send("sub_first");
    await send("sub_first");
    expect(await scheduledEmails(t)).toHaveLength(1);

    await send("sub_second");
    expect(await scheduledEmails(t)).toHaveLength(2);
  });

  test("does nothing for a user who no longer exists", async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("users", {
        authId: "user_deleted",
        email: "deleted@example.com",
        name: "Deleted User",
      });
      await ctx.db.delete(id);
      return id;
    });

    await Promise.all(
      [userId, "not_a_user_id", ""].map((id) =>
        t.mutation(internal.billing.mutations.sendProWelcomeEmailOnce, {
          stripeSubscriptionId: "sub_orphan",
          userId: id,
        })
      )
    );

    expect(await scheduledEmails(t)).toHaveLength(0);
  });
});

describe("subscription status", () => {
  const statusFor = (...statuses: string[]) =>
    getSubscriptionStatusForUser(
      {
        runQuery: () =>
          Promise.resolve(
            statuses.map((status) => ({
              cancelAtPeriodEnd: false,
              currentPeriodEnd: 2_000_000_000,
              priceId: "price_test",
              status,
            }))
          ),
      } as never,
      "user_test"
    );

  test("a failed payment gives no Pro access but keeps the status", async () => {
    const statuses = ["past_due", "unpaid", "paused"];
    const results = await Promise.all(statuses.map((s) => statusFor(s)));
    expect(results).toMatchObject(
      statuses.map((status) => ({ plan: "free", status }))
    );
  });

  test("Pro access takes priority over a failed payment", async () => {
    expect(await statusFor("past_due", "active")).toMatchObject({
      plan: "pro",
      status: "active",
    });
  });

  test("an ended subscription gives no status", async () => {
    expect(await statusFor("canceled")).toMatchObject({
      plan: "free",
      status: null,
    });
  });
});
