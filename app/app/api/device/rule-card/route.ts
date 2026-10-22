import { verifyDeviceToken } from "@/lib/device-token";
import { ruleCard } from "@/lib/rule-card";
import { listCircle } from "@/lib/store";

// GET ?elderId=: the Rule Card sentence for the paired Android app (the pairing code goes in the x-ruko-device header).
// It returns the one sentence and the trusted person's first name, nothing else.
export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  if (!verifyDeviceToken(elderId, request.headers.get("x-ruko-device"))) return Response.json({ error: "This phone is not paired." }, { status: 401 });
  const { members } = await listCircle(elderId);
  const first = members.find((m) => m.trusted)?.name.split(" ")[0] ?? null;
  return Response.json({ en: ruleCard(first, "en").rule, hing: ruleCard(first, "hing").rule, name: first });
}
