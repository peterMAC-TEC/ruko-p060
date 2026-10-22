import type { Objection } from "./officer-brain";

// Which face the fake officer makes. Decided by code from the persuasion stage and the tactic in use, never by AI.
export type CallerExpression = "friendly" | "sympathetic" | "stern" | "urgent" | "frustrated";

export function expressionFor(stage: string | null | undefined, objection?: Objection | null, kind?: string): CallerExpression {
  // An answer to what the person just said comes first: warm for fear, money worries and anger ("I understand"), tight for pushback.
  if (kind === "counter" && objection) {
    if (objection === "scared" || objection === "no_money" || objection === "angry") return "sympathetic";
    return "frustrated";
  }
  switch (stage) {
    case "isolation":
    case "authority":
      return "stern";
    case "urgency":
    case "payment_ask":
    case "closing":
      return "urgent";
    default:
      return "friendly"; // contact, fear: the rapport stage
  }
}
