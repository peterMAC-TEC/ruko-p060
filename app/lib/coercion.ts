import type { PaymentBehaviour, Reason } from "./types";

// Signs that a payment is being dictated by someone else, from how it was made
// inside Ruko's own (practice) bank app: counts and timings only, never what
// was typed. Each sign is weak alone (people paste account numbers for honest
// reasons too), so none is "hard" and together they're capped. They matter
// most when the threat engine already sees a call in progress.
// Used only with the person's `transaction_risk` consent.

export const PAUSE_MS = 1500; // a gap this long between amount digits suggests someone reading it out
export const HESITATION_MS = 45_000; // this long on the confirm screen before paying
const CAP = 35;

export function coercionReasons(b: PaymentBehaviour | null | undefined): Reason[] {
  if (!b) return [];
  const r: Reason[] = [];
  if (b.pastedPayee) {
    r.push({ code: "payee_pasted", label: "The payee's account was pasted in from somewhere else", points: 15, hard: false });
  }
  if (b.appSwitches >= 1) {
    r.push({
      code: "app_switching",
      label: `Left the app ${b.appSwitches} ${b.appSwitches === 1 ? "time" : "times"} in the middle of the payment`,
      points: b.appSwitches >= 2 ? 20 : 10,
      hard: false,
    });
  }
  if (b.amountPauses >= 2) {
    r.push({ code: "dictated_amount", label: "The amount was typed in pieces, as if someone was reading it out", points: 15, hard: false });
  }
  if (b.confirmDwellMs >= HESITATION_MS) {
    r.push({ code: "hesitation", label: `A long pause (${Math.round(b.confirmDwellMs / 1000)} s) before pressing Pay`, points: 10, hard: false });
  }
  // One sign alone is too common in honest payments: it takes at least two (docs/research/08).
  if (r.length < 2) return [];
  // Cap the total so behaviour alone can't hold a payment.
  let left = CAP;
  return r.map((x) => {
    const points = Math.min(x.points, left);
    left -= points;
    return { ...x, points };
  });
}
