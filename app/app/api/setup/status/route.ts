import { z } from "zod";
import { deny } from "@/lib/auth";
import { setupStatus, type SetupEvent } from "@/lib/setup-status";
import { canSetUp } from "@/lib/setup-auth";
import { getRiskEvent, getUser, listAlerts, listCircle } from "@/lib/store";

const Q = z.object({ elderId: z.string().min(1), memberId: z.string().min(1) });

// GET ?elderId&memberId: where the family's setup of Ruko has got to, worked out from what really happened.
export async function GET(request: Request) {
  const u = new URL(request.url);
  const parsed = Q.safeParse({ elderId: u.searchParams.get("elderId"), memberId: u.searchParams.get("memberId") });
  if (!parsed.success) return Response.json({ error: "elderId and memberId required" }, { status: 400 });
  const { elderId, memberId } = parsed.data;
  const allowed = await canSetUp(elderId, memberId);
  if (!allowed.ok) return deny(allowed);

  const [{ members, codeWordSet }, alerts, elder] = await Promise.all([listCircle(elderId), listAlerts({ memberId }), getUser(elderId)]);
  const events: SetupEvent[] = [];
  for (const a of alerts.slice(0, 30)) {
    const risk = await getRiskEvent(a.risk_event_id);
    if (risk && risk.elder_id === elderId) events.push({ source: risk.source, reasonCodes: risk.reasons.map((r) => r.code) });
  }
  const trusted = members.find((m) => m.trusted) ?? null;
  return Response.json({
    status: setupStatus({ trustedName: trusted?.name.split(" ")[0] ?? null, codeWordSet, events }),
    trusted: trusted ? { name: trusted.name, phone: trusted.phone } : null,
    memberIsTrusted: Boolean(members.find((m) => m.id === memberId)?.trusted),
    elderName: elder?.name ?? null,
  });
}
