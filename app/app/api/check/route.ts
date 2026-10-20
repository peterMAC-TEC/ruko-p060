import { z } from "zod";
import { canActAsElder, deny, isDemoId } from "@/lib/auth";
import { alertCircle } from "@/lib/circle";
import { recordEvent } from "@/lib/metrics";
import { runRadar, type Sensitivity } from "@/lib/radar";
import { activeIntents } from "@/lib/callIntent";
import { IDENTITY_LR, QUESTION_TACTIC, TACTICS } from "@/lib/threat";
import { lockMoney, observe, recordAction, type NewObservation } from "@/lib/threat-server";
import { addRiskEvent, getUser, listCircle, loadPatternLibrary } from "@/lib/store";
import { cleanSigns, reasonLabels, SIGN_IDS, withSigns } from "@/lib/signs";

// The device has already shown STOP (the check runs on the device against the
// cached library, in well under a second). This route records the result and,
// for a STOP, brings in the family and turns on protection.

const Answer = z.enum(["yes", "no", "unsure"]);
const Body = z.object({
  elderId: z.string().min(1),
  identity: z
    .enum(["police", "courier", "bank", "electricity", "customer_care", "family", "investment", "video_stranger", "loan", "tech_support", "unknown"])
    .optional(),
  answers: z
    .object({
      stay_on_call: Answer.optional(),
      pay_avoid_arrest: Answer.optional(),
      install_app: Answer.optional(),
      share_otp: Answer.optional(),
      keep_secret: Answer.optional(),
    })
    .default({}),
  // What the person said about the call. Scored here, never stored.
  said: z.string().max(2000).optional(),
  // How long the device took from the last answer to showing the warning.
  msToWarning: z.number().min(0).max(60_000).optional(),
  // Warning signs the AI found in what they said or showed (/api/check/read).
  // Only the codes are stored; the evidence stays on the device.
  signs: z.array(z.object({ id: z.enum(SIGN_IDS), evidence: z.string().max(400) })).max(SIGN_IDS.length).optional(),
  patternId: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid check" }, { status: 400 });
  const { elderId, identity, answers, said, msToWarning, signs: rawSigns, patternId: aiPatternId } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const [lib, elder] = await Promise.all([loadPatternLibrary(), getUser(elderId)]);
  const sensitivity: Sensitivity = elder?.sensitivity ?? "normal";
  // The same verdict the device showed: the radar, then (only when the AI read the words or photo) its signs.
  const radar = runRadar(lib, { identity, answers, said, sensitivity });
  const result = rawSigns ? withSigns(radar, cleanSigns(rawSigns), lib, aiPatternId) : radar;
  const demo = isDemoId(elderId);
  const patternId = result.pattern?.id ?? null;
  const codes = patternId ? [`pattern_${patternId}`, ...result.signals] : result.signals;
  const reasons = reasonLabels(codes, lib).map((r) => ({ ...r, points: 0, hard: false }));
  const score = result.level === "stop" ? 90 : result.level === "caution" ? 45 : 0;

  let familyAlerted = false;
  if (result.level === "stop") {
    await recordEvent("scam_flagged", { patternId, demo });
    await recordEvent("stop_shown", { patternId, demo });
    if (msToWarning !== undefined) await recordEvent("time_to_warning", { value: msToWarning, patternId, demo });
    const { members } = await listCircle(elderId);
    if (members.length > 0) {
      await alertCircle(elderId, { source: "agent", score, reasons });
      familyAlerted = true;
    } else {
      await addRiskEvent({ elder_id: elderId, source: "agent", score, reasons });
    }
    await lockMoney(elderId, result.pattern ? `Ruko's check found a likely scam: ${result.pattern.name.en}` : "Ruko's check found a likely scam");
    await recordAction(elderId, "money_lock", "radar", "STOP from the guided check");
    if (familyAlerted) await recordAction(elderId, "alert_family", "radar", "STOP from the guided check");
  } else {
    await addRiskEvent({ elder_id: elderId, source: "agent", score, reasons });
  }

  // Feed the threat engine: who they claim to be, each "yes", phrases heard,
  // and whether a "bank" caller is backed by a signed notice from the real bank.
  const observations: NewObservation[] = [];
  if (identity && identity !== "unknown" && IDENTITY_LR[identity]) {
    observations.push({ tactic: "RT02", source: "radar", lr: IDENTITY_LR[identity], evidence: `claims: ${identity}` });
  }
  let verifiedBankCall = false;
  if (identity === "bank") {
    const live = await activeIntents(elderId);
    // Only a notice whose code the person confirmed counts as the real bank on the line;
    // a live but unconfirmed notice proves nothing about *this* caller (security review M2).
    verifiedBankCall = live.some((i) => i.codeMatch === true);
    if (verifiedBankCall) observations.push({ tactic: "RT17", source: "callintent", evidence: "the caller read out the right code" });
    else if (!live.length) observations.push({ tactic: "RT15", source: "callintent", evidence: "no signed notice from the bank" });
  }
  for (const [q, a] of Object.entries(answers)) {
    if (a !== "yes" && a !== "unsure") continue;
    for (const tactic of QUESTION_TACTIC[q] ?? []) {
      // "Not sure" counts as weak evidence: the square root of the likelihood ratio.
      const lr = a === "unsure" ? Math.sqrt(TACTICS[tactic].lr) : undefined;
      observations.push({ tactic, source: "radar", lr, evidence: `${q}: ${a}` });
    }
  }
  if (result.signals.some((s) => s.startsWith("said_")) && result.pattern) {
    observations.push({ tactic: result.pattern.severity === "high" ? "RT03" : "RT04", source: "radar", evidence: `phrases: ${result.pattern.id}` });
  }
  const threat = await observe(elderId, observations, {
    floor: result.level === "stop" ? "high" : undefined,
    skip: result.level === "stop" ? ["money_lock", ...(familyAlerted ? (["alert_family"] as const) : [])] : [],
  });
  if (threat.actions.includes("alert_family")) familyAlerted = true;

  return Response.json({
    level: result.level,
    yes: result.yes,
    patternId,
    familyAlerted,
    verifiedBankCall,
    threat: { level: threat.assessment.level, probability: threat.assessment.probability, stage: threat.assessment.stage },
  });
}
