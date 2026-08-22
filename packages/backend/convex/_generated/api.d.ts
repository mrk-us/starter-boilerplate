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
import type * as auth_types from "../auth/types.js";
import type * as auth_validation from "../auth/validation.js";
import type * as billing_actions from "../billing/actions.js";
import type * as billing_constants from "../billing/constants.js";
import type * as billing_events from "../billing/events.js";
import type * as billing_helpers from "../billing/helpers.js";
import type * as billing_index from "../billing/index.js";
import type * as billing_queries from "../billing/queries.js";
import type * as billing_types from "../billing/types.js";
import type * as billing_validation from "../billing/validation.js";
import type * as crons from "../crons.js";
import type * as emails_actions from "../emails/actions.js";
import type * as emails_events from "../emails/events.js";
import type * as emails_helpers from "../emails/helpers.js";
import type * as emails_index from "../emails/index.js";
import type * as errors_constants from "../errors/constants.js";
import type * as errors_index from "../errors/index.js";
import type * as errors_types from "../errors/types.js";
import type * as http from "../http.js";
import type * as r2 from "../r2.js";
import type * as rateLimiter from "../rateLimiter.js";
import type * as users_actions from "../users/actions.js";
import type * as users_constants from "../users/constants.js";
import type * as users_helpers from "../users/helpers.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_types from "../users/types.js";
import type * as users_validation from "../users/validation.js";
import type * as utils from "../utils.js";

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
  "auth/types": typeof auth_types;
  "auth/validation": typeof auth_validation;
  "billing/actions": typeof billing_actions;
  "billing/constants": typeof billing_constants;
  "billing/events": typeof billing_events;
  "billing/helpers": typeof billing_helpers;
  "billing/index": typeof billing_index;
  "billing/queries": typeof billing_queries;
  "billing/types": typeof billing_types;
  "billing/validation": typeof billing_validation;
  crons: typeof crons;
  "emails/actions": typeof emails_actions;
  "emails/events": typeof emails_events;
  "emails/helpers": typeof emails_helpers;
  "emails/index": typeof emails_index;
  "errors/constants": typeof errors_constants;
  "errors/index": typeof errors_index;
  "errors/types": typeof errors_types;
  http: typeof http;
  r2: typeof r2;
  rateLimiter: typeof rateLimiter;
  "users/actions": typeof users_actions;
  "users/constants": typeof users_constants;
  "users/helpers": typeof users_helpers;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/types": typeof users_types;
  "users/validation": typeof users_validation;
  utils: typeof utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  workOSAuthKit: import("@convex-dev/workos-authkit/_generated/component.js").ComponentApi<"workOSAuthKit">;
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
