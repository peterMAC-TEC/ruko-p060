import "server-only";
import { createHash } from "node:crypto";
import { notify } from "./notify";
import { addRiskEvent, createAlerts, getUser, listCircle } from "./store";
import type { AlertChannel, Reason, RiskEvent, RiskSource } from "./types";

// Family Safety Circle: when risk is high or the elder asks, everyone in the
// circle is told to call the elder now. The social interrupt is the intervention.

/** Code words are stored only as a salted hash; nobody can read them back. */
export function hashCodeWord(elderId: string, word: string) {
  const normalised = word.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("sha256").update(`ruko:${elderId}:${normalised}`).digest("hex");
}

const MESSAGES: Record<RiskSource, (name: string) => string> = {
  elder: (n) =>
    `${n} quietly tapped "Tell my family" in Ruko. ${n} may be on a scam call and unable to talk freely. Please call ${n} now.`,
  bank: (n) => `${n}'s bank paused a risky payment. ${n} may be on a scam call. Please call ${n} now.`,
  agent: (n) => `Ruko's call check says ${n} is probably on a scam call. Please call ${n} now.`,
  signal: (n) => `${n} has been on a long call with an unknown number. Please call ${n} now.`,
};

export async function alertCircle(
  elderId: string,
  trigger: { source: RiskSource; score: number; reasons: Reason[]; message?: string } | { riskEvent: RiskEvent },
) {
  const riskEvent =
    "riskEvent" in trigger
      ? trigger.riskEvent
      : await addRiskEvent({ elder_id: elderId, source: trigger.source, score: trigger.score, reasons: trigger.reasons });

  const [elder, { members }] = await Promise.all([getUser(elderId), listCircle(elderId)]);
  const first = elder?.name.split(" ")[0] ?? "Your family member";
  const message = ("message" in trigger && trigger.message) || MESSAGES[riskEvent.source](first);

  // The in-app alert always goes out. SMS and a voice call follow when real
  // telephony is on; in mock mode notify() only logs them.
  const rows: Array<{ risk_event_id: string; member_id: string; channel: AlertChannel; message: string }> = members.map(
    (m) => ({ risk_event_id: riskEvent.id, member_id: m.id, channel: "app", message }),
  );
  const phoned = await Promise.all(
    members.flatMap((m) => [notify(m, "sms", message), notify(m, "voice", message)].map((p) => p.then((r) => ({ m, r })))),
  );
  for (const { m, r } of phoned) {
    if (r.sent) rows.push({ risk_event_id: riskEvent.id, member_id: m.id, channel: r.channel, message });
    if (r.error) console.error(`[notify] ${r.channel} to ${m.name} failed: ${r.error}`);
  }

  const alerts = await createAlerts(rows);
  return { riskEvent, alerts, members };
}
