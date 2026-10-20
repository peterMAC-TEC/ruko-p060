import "server-only";
import { flags } from "./flags";
import { insertEvent, listEvents, type EventKind } from "./store";

// Privacy-safe, anonymous metrics (v2 §5): what happened and how much, never
// who. Demo-sandbox events are tagged so real numbers stay clean.

export async function recordEvent(kind: EventKind, opts: { value?: number; patternId?: string | null; demo: boolean }) {
  try {
    await insertEvent({ kind, value: opts.value ?? null, pattern_id: opts.patternId ?? null, demo: opts.demo });
  } catch (e) {
    // Metrics must never break protection.
    console.error("[metrics]", e);
  }
}

export interface ImpactSummary {
  days: number;
  includesDemo: boolean;
  scamsFlagged: number;
  stopShown: number;
  moneyLockTriggers: number;
  paymentsAbandoned: number;
  /** The "money saved" number: the total of payments people chose not to make. */
  moneySaved: number;
  confirmedScams: number;
  falsePositives: number;
  /** False positives as a share of warnings people gave feedback on. */
  falsePositiveRate: number | null;
  medianMsToWarning: number | null;
  emergencyOpened: number;
  byPattern: Array<{ patternId: string; flagged: number }>;
}

export async function impactSummary(days = 30, includeDemo = flags.DEMO_MODE): Promise<ImpactSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows = await listEvents(since, includeDemo);
  const of = (k: EventKind) => rows.filter((r) => r.kind === k);
  const sum = (k: EventKind) => of(k).reduce((n, r) => n + Number(r.value ?? 0), 0);

  const times = of("time_to_warning")
    .map((r) => Number(r.value))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : null;

  const confirmed = of("confirmed_scam").length;
  const falsePositives = of("false_positive").length;
  const byPattern = new Map<string, number>();
  for (const r of of("scam_flagged")) if (r.pattern_id) byPattern.set(r.pattern_id, (byPattern.get(r.pattern_id) ?? 0) + 1);

  return {
    days,
    includesDemo: includeDemo,
    scamsFlagged: of("scam_flagged").length,
    stopShown: of("stop_shown").length,
    moneyLockTriggers: of("money_lock_triggered").length,
    paymentsAbandoned: of("payment_abandoned").length,
    moneySaved: sum("payment_abandoned"),
    confirmedScams: confirmed,
    falsePositives,
    falsePositiveRate: confirmed + falsePositives > 0 ? falsePositives / (confirmed + falsePositives) : null,
    medianMsToWarning: median,
    emergencyOpened: of("emergency_opened").length,
    byPattern: [...byPattern.entries()].map(([patternId, flagged]) => ({ patternId, flagged })).sort((a, b) => b.flagged - a.flagged),
  };
}
