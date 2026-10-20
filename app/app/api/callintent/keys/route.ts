import { publicKeys } from "@/lib/callIntent";

// The bank's public signing keys (Ed25519, JWK). Public by design: anyone can
// verify a notice, only the bank can sign one.
export async function GET() {
  return Response.json(publicKeys(), { headers: { "cache-control": "public, max-age=300" } });
}
