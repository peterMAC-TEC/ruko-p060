// The family setup checklist, worked out from what really happened (never from a tick box on the screen).
// Four things: the Rule Card (needs a trusted person), the family code word, a test alert that really arrived on the
// family phone, and a practice drill that really raised a Ruko alert.

export interface SetupEvent {
  source: string;
  reasonCodes: string[];
}

export interface SetupInputs {
  trustedName: string | null;
  codeWordSet: boolean;
  /** Risk events that produced an alert for this family member. */
  events: SetupEvent[];
}

export interface SetupStatus {
  ruleCardSet: boolean;
  codeWordSet: boolean;
  testAlertReceived: boolean;
  drillDone: boolean;
  done: number;
  of: 4;
  complete: boolean;
}

export const TEST_ALERT_CODE = "setup_test";

export function setupStatus(i: SetupInputs): SetupStatus {
  const ruleCardSet = Boolean(i.trustedName);
  const testAlertReceived = i.events.some((e) => e.reasonCodes.includes(TEST_ALERT_CODE));
  // A drill is a real STOP from Ruko's own check (source "agent"), not a test alert.
  const drillDone = i.events.some((e) => e.source === "agent" && !e.reasonCodes.includes(TEST_ALERT_CODE));
  const done = [ruleCardSet, i.codeWordSet, testAlertReceived, drillDone].filter(Boolean).length;
  return { ruleCardSet, codeWordSet: i.codeWordSet, testAlertReceived, drillDone, done, of: 4, complete: done === 4 };
}
