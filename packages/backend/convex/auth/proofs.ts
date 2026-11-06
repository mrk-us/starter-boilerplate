const encoder = new TextEncoder();

/** The address of a visitor, signed by the app server */
export interface ClientProof {
  address: string;
  proof: string;
}

// The app server and Convex both hold this key, so setup needs no new secret.
function importSigningKey() {
  const secret = process.env.WORKOS_API_KEY;

  if (!secret) {
    throw new Error("WORKOS_API_KEY is not set");
  }

  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"]
  );
}

async function sign(label: string, value: string) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importSigningKey(),
    encoder.encode(`${label}:${value}`)
  );

  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

// crypto.subtle.verify takes the same time for each wrong signature.
async function verify(label: string, value: string, signature: string) {
  return await crypto.subtle.verify(
    "HMAC",
    await importSigningKey(),
    Uint8Array.from(signature.match(/../g) ?? [], (pair) =>
      Number.parseInt(pair, 16)
    ),
    encoder.encode(`${label}:${value}`)
  );
}

/**
 * Convex cannot see the address of a caller, so the app server signs it. Convex
 * can then limit each client and reject calls that skip the app server.
 *
 * Only the last X-Forwarded-For entry comes from the nearest proxy. The client
 * can write the entries before it.
 */
export async function createClientProof(
  forwardedFor: string | null | undefined
): Promise<ClientProof> {
  const address = forwardedFor?.split(",").pop()?.trim() ?? "";

  return { address, proof: await sign("client", address) };
}

export function isClientProofValid({ address, proof }: ClientProof) {
  return verify("client", address, proof);
}

/**
 * Lets the verify page ask for a new email for this account only. It stops
 * anonymous callers sending email to any account id.
 */
export function createVerifyToken(authId: string) {
  return sign("verify", authId);
}

export function isVerifyTokenValid(authId: string, token: string) {
  return verify("verify", authId, token);
}
