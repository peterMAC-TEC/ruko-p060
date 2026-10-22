import "server-only";
import { alertCircle } from "./circle";
import { isDemoId } from "./auth";
import { recordEvent } from "./metrics";
import {
  alertMessage,
  cleanReasonCodes,
  elderNotice,
  NUMBER_CODE_PREFIX,
  numberKey,
  REASON_LABEL,
  SCORE,
  shouldAlert,
  throttle,
  type AlertBodyT,
} from "./risk-alert";
import { getUser, listCircle, listRiskEvents } from "./store";

export interface RiskAlertResult {
  sent: boolean;
  /** Why nothing was sent, in codes. */
  held?: "not_risky" | "same_number" | "too_many" | "no_family";
  /** The plain-words note for the elder whenever the family was told. */
  notice?: string;
}

/**
 * Tell the family about a risky number. Used by the Android app, the number check and (later) any other source. The
 * alert is signal codes and a hash only; it is held back for green and yellow, for the same number again within ten
 * minutes, and beyond six an hour. No Money Lock and no threat-engine write: a warning is not an accusation.
 */
export async function sendRiskAlert(body: AlertBodyT): Promise<RiskAlertResult> {
  if (!shouldAlert(body.riskLevel)) return { sent: false, held: "not_risky" };
  const { members } = await listCircle(body.elderId);
  if (members.length === 0) return { sent: false, held: "no_family" };

  const key = numberKey(body.numberHash);
  const recent = (await listRiskEvents(body.elderId, 30)).filter((r) => r.reasons.some((x) => x.code === "risky_number"));
  const history = recent.map((r) => ({
    at: Date.parse(r.created_at),
    numberKey: r.reasons.find((x) => x.code.startsWith(NUMBER_CODE_PREFIX))?.code.slice(NUMBER_CODE_PREFIX.length) ?? null,
  }));
  const gate = throttle(history, Date.now(), key);
  if (!gate.allow) return { sent: false, held: gate.reason };

  const first = (await getUser(body.elderId))?.name.split(" ")[0] ?? "your family member";
  const codes = cleanReasonCodes(body.reasonCodes);
  const reasons = [
    { code: "risky_number", label: `Ruko graded an incoming number ${body.riskLevel}`, points: 0, hard: false },
    ...(key ? [{ code: `${NUMBER_CODE_PREFIX}${key}`, label: "A number Ruko has seen", points: 0, hard: false }] : []),
    ...codes.map((c) => ({ code: c, label: REASON_LABEL[c], points: 0, hard: false })),
  ];
  await alertCircle(body.elderId, { source: "signal", score: SCORE[body.riskLevel], reasons, message: alertMessage(first, body.riskLevel) });
  await recordEvent("scam_flagged", { demo: isDemoId(body.elderId) });
  const trusted = members.find((m) => m.trusted) ?? members[0];
  return { sent: true, notice: elderNotice(trusted.name.split(" ")[0]) };
}
