/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_actions from "../auth/actions.js";
import type * as auth_constants from "../auth/constants.js";
import type * as auth_events from "../auth/events.js";
import type * as auth_helpers from "../auth/helpers.js";
import type * as auth_index from "../auth/index.js";
import type * as auth_oauth from "../auth/oauth.js";
import type * as auth_types from "../auth/types.js";
import type * as auth_validation from "../auth/validation.js";
import type * as crons from "../crons.js";
import type * as emails_actions from "../emails/actions.js";
import type * as emails_events from "../emails/events.js";
import type * as emails_index from "../emails/index.js";
import type * as errors_constants from "../errors/constants.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as users_actions from "../users/actions.js";
import type * as users_constants from "../users/constants.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_validation from "../users/validation.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/actions": typeof auth_actions;
  "auth/constants": typeof auth_constants;
  "auth/events": typeof auth_events;
  "auth/helpers": typeof auth_helpers;
  "auth/index": typeof auth_index;
  "auth/oauth": typeof auth_oauth;
  "auth/types": typeof auth_types;
  "auth/validation": typeof auth_validation;
  crons: typeof crons;
  "emails/actions": typeof emails_actions;
  "emails/events": typeof emails_events;
  "emails/index": typeof emails_index;
  "errors/constants": typeof errors_constants;
  health: typeof health;
  http: typeof http;
  rateLimiter: typeof rateLimiter;
  "users/actions": typeof users_actions;
  "users/constants": typeof users_constants;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/validation": typeof users_validation;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  workOSAuthKit: import("@convex-dev/workos-authkit/_generated/component.js").ComponentApi<"workOSAuthKit">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
