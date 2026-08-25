import { type AuthFunctions, AuthKit } from "@convex-dev/workos-authkit";
import { components, internal } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";

const authFunctions: AuthFunctions = {
  authKitAction: internal.auth.actions.authKitAction,
  authKitEvent: internal.auth.events.authKitEvent,
};

/**
 * Auth client configuration
 *
 * Environment variables required:
 * - WORKOS_API_KEY: Your WorkOS API key
 * - WORKOS_ACTION_SECRET: WorkOS Action signing secret or setup placeholder
 * - WORKOS_CLIENT_ID: Your WorkOS client ID
 * - WORKOS_WEBHOOK_SECRET: Your WorkOS webhook secret
 *
 */

/**
 * Initialize AuthKit component
 */
export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  additionalEventTypes: [
    "session.created",
    "invitation.created",
    "password_reset.created",
    "email_verification.created",
  ],
  authFunctions,
});
