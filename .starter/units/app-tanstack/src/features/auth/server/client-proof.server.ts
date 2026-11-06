import { createClientProof } from "@repo/backend/convex/auth/proofs";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

/**
 * Signs the address of the visitor for anonymous Convex auth actions. A Node
 * server with no proxy gets no X-Forwarded-For, so it uses the socket address.
 */
export function getClientProof() {
  return createClientProof(
    getRequestHeader("x-forwarded-for") ?? getRequestIP()
  );
}
