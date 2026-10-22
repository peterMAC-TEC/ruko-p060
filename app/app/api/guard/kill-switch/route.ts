import { z } from "zod";
import { canActForElder, deny, isDemoId } from "@/lib/auth";
import { alertCircle } from "@/lib/circle";
import { codeWordGate } from "@/lib/code-word";
import { getProtection, getUser, listCircle, setProtection } from "@/lib/store";
import { recordAction } from "@/lib/threat-server";

const Body = z.object({
  elderId: z.string().min(1),
  action: z.enum(["pause", "resume"]),
  /** Who pressed it. Needed in the demo sandbox, where there is no sign-in to tell. */
  by: z.enum(["elder", "family"]).default("elder"),
  codeWord: z.string().max(60).optional(),
});

// The customer's kill switch (the RBI draft's "disable all digital payments"): pause every payment instantly. The elder
// or the family can pause. Resuming needs the family code word (when one is set), so a scammer on the phone cannot talk
// the elder into turning payments back on.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { elderId, action, by, codeWord } = parsed.data;
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);

  if (action === "pause") {
    await setProtection(elderId, { payments_paused: true, paused_at: new Date().toISOString() });
    await recordAction(elderId, "kill_switch", "bank", "payments paused");
    const first = (await getUser(elderId))?.name.split(" ")[0] ?? "Your family member";
    // The family is told if the elder did it, so nobody is left guessing why payments stopped.
    if (by === "elder" || (!isDemoId(elderId) && allowed.viewer?.user?.id === elderId)) {
      await alertCircle(elderId, {
        source: "elder",
        score: 40,
        reasons: [{ code: "kill_switch", label: "All digital payments were paused", points: 0, hard: false }],
        message: `${first} paused all digital payments in Ruko. Please call ${first} to check everything is all right.`,
      });
    }
    return Response.json({ paused: true });
  }

  // Resume: the family code word, when one is set.
  const gate = await codeWordGate(elderId, "approved", codeWord, { force: true });
  if (gate !== "ok") return Response.json({ error: gate }, { status: 403 });
  // With no code word set, the elder alone cannot resume (a scammer could coach them): a family member must.
  const { codeWordSet } = await listCircle(elderId);
  if (!codeWordSet && !isDemoId(elderId) && allowed.viewer?.user?.id === elderId) return Response.json({ error: "family_must_resume" }, { status: 403 });
  const p = await getProtection(elderId);
  if (!p.payments_paused) return Response.json({ paused: false });
  await setProtection(elderId, { payments_paused: false, paused_at: null });
  await recordAction(elderId, "kill_switch_resume", "bank", "payments resumed");
  return Response.json({ paused: false });
}
