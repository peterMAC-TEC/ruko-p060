// The Voice Trust rule, as plain code with no server needed (so it can be tested): after a call Ruko flagged, APPROVING a
// payment needs the family code word. Saying no never does. With no code word set, nothing changes.

export type GateResult = "ok" | "code_word_needed" | "code_word_wrong";

export function approvalGate(o: {
  decision: "approved" | "declined";
  protectionActive: boolean;
  codeWordSet: boolean;
  supplied?: string;
  matches: boolean;
}): GateResult {
  if (o.decision === "declined") return "ok";
  if (!o.protectionActive || !o.codeWordSet) return "ok";
  if (!o.supplied?.trim()) return "code_word_needed";
  return o.matches ? "ok" : "code_word_wrong";
}
