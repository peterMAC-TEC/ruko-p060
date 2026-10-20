import "server-only";
import { isDemoId } from "./auth";
import { alertCircle } from "./circle";
import { appendThreatEvents, getProtection, getUser, listCircle, listThreatEvents, setProtection, type ThreatEventRow } from "./store";
import {
  assess,
  LEVELS,
  playbookFor,
  STAGES,
  TACTICS,
  type Observation,
  type PlaybookAction,
  type TacticId,
  type ThreatAssessment,
  type ThreatLevel,
  type ThreatSource,
} from "./threat";
import type { Reason } from "./types";

// Server side of the threat engine: record observations in the person's
// hash-chained log, re-assess, and run the response playbook. Every automatic
// action is itself logged in the chain, so "what Ruko saw and what it did" can
// be replayed and verified later (for the bank, 1930, or the research).

const WINDOW_DAYS = 7;

/** The protection reason that marks a duress freeze (shown only to family and the bank). */
export const DURESS_REASON = "Duress PIN used: every payment is frozen";

/** A duress freeze is on until family or the bank clears protection. */
export async function duressActive(elderId: string) {
  const p = await getProtection(elderId);
  return p.active && p.reason === DURESS_REASON;
}

/**
 * Turns on protection unless it's already on. Never overwrites the reason: a
 * duress freeze must not be replaced by a later, visible hold (review H1).
 */
export async function lockMoney(elderId: string, reason: string) {
  const p = await getProtection(elderId);
  if (p.active) return false;
  await setProtection(elderId, { active: true, since: new Date().toISOString(), reason, cleared_by: null, cleared_at: null });
  return true;
}
/** Don't repeat the same automatic action within this many minutes. */
const ACTION_COOLDOWN: Partial<Record<PlaybookAction, number>> = { alert_family: 30 };
const DEFAULT_COOLDOWN = 120;

export interface NewObservation {
  tactic: TacticId;
  source: ThreatSource;
  lr?: number;
  evidence?: string;
}

const rank = (l: ThreatLevel) => LEVELS.length - 1 - LEVELS.findIndex((x) => x.level === l);

function toObservations(rows: ThreatEventRow[]): Observation[] {
  return rows
    .filter((r) => r.kind === "observation" && r.tactic && r.tactic in TACTICS)
    .map((r) => ({
      tactic: r.tactic as TacticId,
      at: r.at,
      source: r.source as ThreatSource,
      lr: r.lr ?? undefined,
      evidence: r.evidence ?? undefined,
    }));
}

export async function assessElder(elderId: string): Promise<{ assessment: ThreatAssessment; events: ThreatEventRow[] }> {
  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const events = await listThreatEvents(elderId, since);
  return { assessment: assess(toObservations(events)), events };
}

/** Logs an action taken outside the playbook (the bank hold, an SOS…) so the chain stays complete. */
export async function recordAction(elderId: string, action: PlaybookAction | string, source: ThreatSource, evidence?: string) {
  await appendThreatEvents(elderId, [{ kind: "action", source, action, evidence }], isDemoId(elderId));
}

function stageLine(a: ThreatAssessment) {
  return a.stagesActive.map((s) => STAGES.find((x) => x.id === s)!.name.toLowerCase()).join(" → ");
}

/**
 * Records observations, re-assesses and runs the playbook.
 * `floor` raises the effective level for deterministic policy (rules can only
 * raise, never lower); `skip` names actions the caller has already taken.
 */
export async function observe(
  elderId: string,
  observations: NewObservation[],
  opts: { floor?: ThreatLevel; skip?: PlaybookAction[]; amount?: number } = {},
): Promise<{ assessment: ThreatAssessment; actions: PlaybookAction[]; riskEventId?: string }> {
  const demo = isDemoId(elderId);
  if (observations.length) {
    await appendThreatEvents(
      elderId,
      observations.map((o) => ({ kind: "observation" as const, source: o.source, tactic: o.tactic, lr: o.lr ?? TACTICS[o.tactic].lr, evidence: o.evidence })),
      demo,
    );
  }
  const { assessment, events } = await assessElder(elderId);
  const level = opts.floor && rank(opts.floor) > rank(assessment.level) ? opts.floor : assessment.level;
  const plan = playbookFor(level, { duress: assessment.duress, stage: assessment.stage }).filter((a) => !opts.skip?.includes(a));

  const recent = (action: PlaybookAction) => {
    const minutes = ACTION_COOLDOWN[action] ?? DEFAULT_COOLDOWN;
    const since = Date.now() - minutes * 60_000;
    return events.some((e) => e.kind === "action" && e.action === action && Date.parse(e.at) >= since);
  };

  const taken: PlaybookAction[] = [];
  let riskEventId: string | undefined;
  const elder = await getUser(elderId);
  const first = elder?.name.split(" ")[0] || "Your family member";

  for (const action of plan) {
    if (recent(action)) continue;
    if (action === "money_lock" || action === "freeze_outbound") {
      const p = await getProtection(elderId);
      if (assessment.duress && p.active && p.reason !== DURESS_REASON) {
        // Duress outranks any earlier hold: upgrade the reason so later payments stay quiet.
        await setProtection(elderId, { ...p, reason: DURESS_REASON });
      } else if (!p.active) {
        await lockMoney(elderId, assessment.duress ? DURESS_REASON : `Ruko's threat engine: likely scam in progress (${stageLine(assessment)})`);
      }
    }
    if (action === "alert_family") {
      const { members } = await listCircle(elderId);
      if (!members.length) continue;
      const reasons: Reason[] = assessment.tactics
        .filter((t) => t.weight > 0)
        .slice(0, 5)
        .map((t) => ({ code: t.tactic, label: TACTICS[t.tactic].elder.en, points: Math.round(t.weight * 10), hard: false }));
      const message = assessment.duress
        ? `URGENT: ${first} used the Ruko safety PIN${opts.amount ? ` while paying ₹${Math.round(opts.amount).toLocaleString("en-IN")}` : ""}. ${first} may be with a scammer right now. Call ${first}; if ${first} can't talk freely, call 112.`
        : `Ruko thinks ${first} may be in a scam right now (${stageLine(assessment) || "warning signs"}). Please call ${first} now.`;
      const { riskEvent } = await alertCircle(elderId, { source: "agent", score: Math.round(assessment.probability * 100), reasons, message });
      riskEventId = riskEvent.id;
    }
    await appendThreatEvents(elderId, [{ kind: "action", source: "radar", action, evidence: `${level} · p=${assessment.probability.toFixed(3)}` }], demo);
    taken.push(action);
  }
  return { assessment, actions: taken, riskEventId };
}

/** A compact view of the assessment for the fraud desk and the family. */
export function summary(a: ThreatAssessment) {
  return {
    level: a.level,
    probability: a.probability,
    stage: a.stage,
    stagesActive: a.stagesActive,
    duress: a.duress,
    verifiedCall: a.verifiedCall,
    playbook: a.playbook,
    tactics: a.tactics.map((t) => ({
      id: t.tactic,
      name: TACTICS[t.tactic].name,
      stage: t.stage,
      lr: t.lr,
      weight: Number(t.weight.toFixed(2)),
      at: t.at,
      sources: t.sources,
      evidence: t.evidence,
    })),
  };
}
