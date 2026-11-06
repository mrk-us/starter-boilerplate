import { api } from "@repo/backend/convex/_generated/api";
import {
  checkEmailSchema,
  forgotPasswordSchema,
  signUpSchema,
} from "@repo/backend/convex/auth/validation";
import { getErrorMessage, tryCatch } from "@repo/shared";
import { createServerFn } from "@tanstack/react-start";
import { getClientProof } from "./client-proof.server";
import { convexHttpClient } from "./user-sync.server";

// Server function errors are serialized to the browser, so send only the parsed
// message and not the raw Convex request id and source location.
async function relayErrorMessage<T>(call: Promise<T>) {
  const { data, error } = await tryCatch(call);

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  return data;
}

export const checkEmail = createServerFn({ method: "POST" })
  .validator(checkEmailSchema)
  .handler(async ({ data }) =>
    relayErrorMessage(
      convexHttpClient.action(api.auth.actions.checkEmailExists, {
        clientProof: await getClientProof(),
        email: data.email,
      })
    )
  );

export const createAccount = createServerFn({ method: "POST" })
  .validator(signUpSchema)
  .handler(async ({ data }) =>
    relayErrorMessage(
      convexHttpClient.action(api.auth.actions.createUserAccount, {
        clientProof: await getClientProof(),
        email: data.email,
        password: data.password,
      })
    )
  );

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(forgotPasswordSchema)
  .handler(async ({ data }) =>
    relayErrorMessage(
      convexHttpClient.action(api.auth.actions.requestPasswordReset, {
        clientProof: await getClientProof(),
        email: data.email,
      })
    )
  );
