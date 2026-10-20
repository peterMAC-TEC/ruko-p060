import "server-only";
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, randomInt, sign, type KeyObject } from "node:crypto";
import { b64url, canonical } from "./canonical";
import { endCallIntent, insertCallIntent, listActiveCallIntents, type CallIntentRow } from "./store";

// Verified bank calls. When the bank's fraud desk calls a customer it first
// publishes a signed "we are calling you now" notice to the customer's Ruko
// app (the approach of Monzo / Starling call status and Revolut's Call
// Identification; docs/research/08 §2). The phone verifies the Ed25519
// signature against the bank's published key, so nothing a caller says can
// make a fake call look verified. Each notice carries a 4-digit code the real
// agent reads out: the customer checks it matches (mutual verification).
//
// Production: the signing key lives in an HSM/KMS and the public key is pinned
// in the app. Here: RUKO_BANK_SIGNING_KEY (base64 PKCS#8) or, in development,
// a key generated per server process.

export const ISSUER = { id: "sahyog-bank", name: "Sahyog Bank" } as const;
export const INTENT_TTL_MIN = 10;
export const CLOCK_SKEW_S = 60;

export type IntentPurpose = "payment_check" | "fraud_alert" | "kyc_reminder";
export const PURPOSE_LABEL: Record<IntentPurpose, { en: string; hi: string }> = {
  payment_check: { en: "to check a payment you made", hi: "आपके किए भुगतान की जाँच के लिए" },
  fraud_alert: { en: "about a possible scam on your account", hi: "आपके खाते पर संभावित धोखाधड़ी के बारे में" },
  kyc_reminder: { en: "with a KYC reminder (no OTP will be asked)", hi: "KYC याद दिलाने के लिए (कोई OTP नहीं माँगा जाएगा)" },
};

export interface IntentPayload {
  v: 1;
  kid: string;
  iss: string;
  iss_name: string;
  sub: string;
  agent: string;
  purpose: IntentPurpose;
  /** Read out by the real agent; shown on the customer's screen. */
  code: string;
  iat: number;
  exp: number;
  nonce: string;
}

const g = globalThis as unknown as { __rukoSigner?: { priv: KeyObject; pub: KeyObject; kid: string; ephemeral: boolean } };

function signer() {
  if (g.__rukoSigner) return g.__rukoSigner;
  const env = process.env.RUKO_BANK_SIGNING_KEY;
  let priv: KeyObject;
  let ephemeral = false;
  if (env) {
    priv = createPrivateKey({ key: Buffer.from(env, "base64"), format: "der", type: "pkcs8" });
  } else {
    if (process.env.NODE_ENV === "production") throw new Error("RUKO_BANK_SIGNING_KEY must be set in production");
    priv = generateKeyPairSync("ed25519").privateKey;
    ephemeral = true;
  }
  const pub = createPublicKey(priv);
  const raw = pub.export({ format: "jwk" }).x as string;
  const kid = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  g.__rukoSigner = { priv, pub, kid, ephemeral };
  return g.__rukoSigner;
}

/** The bank's public signing key(s), as a small directory the app fetches and caches. */
export function publicKeys() {
  const s = signer();
  const jwk = s.pub.export({ format: "jwk" });
  return { issuer: ISSUER, keys: [{ kid: s.kid, kty: jwk.kty, crv: jwk.crv, x: jwk.x, alg: "EdDSA" }], ephemeral: s.ephemeral };
}

export function signPayload(payload: IntentPayload): string {
  return b64url.encode(new Uint8Array(sign(null, Buffer.from(canonical(payload), "utf8"), signer().priv)));
}

export async function issueIntent(elderId: string, agent: string, purpose: IntentPurpose): Promise<{ row: CallIntentRow; payload: IntentPayload }> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: IntentPayload = {
    v: 1,
    kid: signer().kid,
    iss: ISSUER.id,
    iss_name: ISSUER.name,
    sub: elderId,
    agent: agent.slice(0, 60),
    purpose,
    code: String(randomInt(1000, 10_000)),
    iat,
    exp: iat + INTENT_TTL_MIN * 60,
    nonce: randomBytes(12).toString("hex"),
  };
  const row = await insertCallIntent({
    id: crypto.randomUUID(),
    elder_id: elderId,
    org: ISSUER.id,
    payload: payload as unknown as Record<string, unknown>,
    sig: signPayload(payload),
    expires_at: new Date(payload.exp * 1000).toISOString(),
  });
  return { row, payload };
}

export async function activeIntents(elderId: string) {
  return (await listActiveCallIntents(elderId)).map((r) => ({
    id: r.id,
    payload: r.payload as unknown as IntentPayload,
    sig: r.sig,
    // Set once the person confirms the caller read out this code (or a different one).
    codeMatch: r.code_match ?? null,
  }));
}

export { endCallIntent };
