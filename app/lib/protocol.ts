import "server-only";
import { canonical } from "./canonical";
import { sha256 } from "./integrity";
import { ALLOCATION_SEED, ALLOCATION_TABLE, MEASURED, SCALE } from "./trial";

// The pilot's pre-registration fingerprint: a SHA-256 over everything that
// defines the analysis (the outcome scale, the primary outcome rule, the
// allocation table and its seed, the measured scripts). Record it before the
// first real call; if anything changes afterwards the fingerprint changes too,
// and the dashboard shows it. (docs/research/06 §4.3, docs/research/08 §6)
export const PROTOCOL = {
  version: "ruko-pilot-v1",
  primary: "stopped_before_pay := furthest_step <= 5 (same act in both arms)",
  secondary: ["money_moved", "control_outcome C0-C3 (false alarm = C3 in Ruko-arm controls)"],
  scale: SCALE.map((s) => ({ level: s.level, short: s.short, long: s.long })),
  allocation: { table: ALLOCATION_TABLE, seed: ALLOCATION_SEED },
  measured: MEASURED,
  stats: ["clopper-pearson", "wilson", "mcnemar-exact", "mcnemar-mid-p", "newcombe-hybrid-score", "wilcoxon-exact", "rank-biserial"],
};

export const protocolFingerprint = () => sha256(canonical(PROTOCOL));
