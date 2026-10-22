import { z } from "zod";
import { deny } from "@/lib/auth";
import { canSetUp } from "@/lib/setup-auth";
import { TEST_ALERT_CODE } from "@/lib/setup-status";
import { addRiskEvent, createAlerts, getUser } from "@/lib/store";

const Body = z.object({ elderId: z.string().min(1), memberId: z.string().min(1) });

// A TEST alert, to the person setting Ruko up and nobody else. It is labelled TEST, it does not turn on Money Lock, it
// does not feed the threat engine or the impact numbers, and it sends no SMS or call.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "elderId and memberId required" }, { status: 400 });
  const { elderId, memberId } = parsed.data;
  const allowed = await canSetUp(elderId, memberId);
  if (!allowed.ok) return deny(allowed);
  const first = (await getUser(elderId))?.name.split(" ")[0] ?? "your family member";
  const risk = await addRiskEvent({
    elder_id: elderId,
    source: "elder",
    score: 0,
    reasons: [{ code: TEST_ALERT_CODE, label: "This is a test alert from Ruko setup. Nothing is wrong.", points: 0, hard: false }],
  });
  await createAlerts([{ risk_event_id: risk.id, member_id: memberId, channel: "app", message: `TEST: this is how Ruko will tell you if ${first} may be on a scam call. Nothing is wrong. You can ignore this.` }]);
  return Response.json({ ok: true, riskEventId: risk.id });
}
