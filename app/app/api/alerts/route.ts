import { z } from "zod";
import { canActAsElder, canActAsMember, canActForElder, deny } from "@/lib/auth";
import { alertCircle } from "@/lib/circle";
import { lockMoney, observe, recordAction } from "@/lib/threat-server";
import { getRiskEvent, getUser, listAlerts } from "@/lib/store";

// GET ?memberId=…    the family member's phone: their alerts, newest first
// GET ?riskEventId=… the elder's screen: who has been alerted and who is calling
export async function GET(request: Request) {
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId") ?? undefined;
  const riskEventId = url.searchParams.get("riskEventId") ?? undefined;
  if (!memberId && !riskEventId) return Response.json({ error: "memberId or riskEventId required" }, { status: 400 });

  if (memberId) {
    const allowed = await canActAsMember(memberId);
    if (!allowed.ok) return deny(allowed);
  } else {
    const risk = await getRiskEvent(riskEventId!);
    if (!risk) return Response.json([]);
    const allowed = await canActForElder(risk.elder_id);
    if (!allowed.ok) return deny(allowed);
  }

  const alerts = (await listAlerts({ memberId, riskEventId })).filter((a) => a.channel === "app");
  const enriched = await Promise.all(
    alerts.map(async (a) => {
      const [member, risk] = await Promise.all([getUser(a.member_id), getRiskEvent(a.risk_event_id)]);
      const elder = risk ? await getUser(risk.elder_id) : undefined;
      return {
        ...a,
        member_name: member?.name,
        elder_id: risk?.elder_id,
        elder_name: elder?.name,
        elder_phone: elder?.phone,
        source: risk?.source,
        score: risk?.score,
        reasons: risk?.reasons.map((r) => r.label) ?? [],
        elder_status: risk?.elder_status ?? null,
        elder_status_at: risk?.elder_status_at ?? null,
      };
    }),
  );
  return Response.json(enriched);
}

const Press = z.object({ elderId: z.string().min(1) });

// POST: the elder pressed "Tell my family". Silent: nothing changes on their
// screen that a scammer watching on video would notice.
export async function POST(request: Request) {
  const parsed = Press.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "elderId required" }, { status: 400 });
  const { elderId } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const { riskEvent, members } = await alertCircle(elderId, { source: "elder", score: 0, reasons: [] });
  if (members.length === 0) return Response.json({ error: "No family in Ruko Family yet" }, { status: 409 });
  // Asking for help is itself a scam signal: large payments wait until family clears it.
  await lockMoney(elderId, "The elder asked their family for help");
  await recordAction(elderId, "alert_family", "family", "the elder tapped Tell my family");
  await recordAction(elderId, "money_lock", "family", "the elder tapped Tell my family");
  await observe(elderId, [{ tactic: "RT16", source: "family", evidence: "Tell my family" }], { skip: ["alert_family", "money_lock"] });
  return Response.json({ risk_event_id: riskEvent.id }, { status: 201 });
}
