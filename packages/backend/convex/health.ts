import { v } from "convex/values";
import { query } from "./_generated/server";

export const check = query({
  args: {},
  handler: () => "ok" as const,
  returns: v.literal("ok"),
});
