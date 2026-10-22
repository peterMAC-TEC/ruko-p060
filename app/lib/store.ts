import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabase } from "./flags";
import { DEMO_DURESS_PIN, DEMO_ELDER_ID, DEMO_USER_IDS, practiceAccount, seedData } from "./seed";
import { hashPin } from "./pin";
import { familyIdFor, type Participant, type TrialCall } from "./trial";
import { chainHash, GENESIS, verifyChain } from "./integrity";
import { BUNDLED_LIBRARY, type PatternLibrary, type ScamPattern } from "./patterns";
import type { Answers, SurveyKind } from "./survey";
import type {
  Alert,
  AlertChannel,
  Approval,
  ApprovalStatus,
  AlertStatus,
  CallSignals,
  CircleMember,
  CircleRow,
  Consent,
  ConsentScope,
  Invite,
  Payee,
  Protection,
  RiskEvent,
  Transfer,
  User,
} from "./types";

// One data interface for the whole app. With Supabase keys it reads and writes
// the database through the server-only secret key (the browser never talks to
// Supabase directly, so RLS keeps the public key locked out). Without keys it
// runs in memory, kept on globalThis so it survives hot reloads.

type Mem = ReturnType<typeof seedData> & { risk: RiskEvent[] };

const g = globalThis as unknown as { __rukoMem?: Mem; __rukoSb?: SupabaseClient; __rukoSeeded?: Promise<void> };

function memSeed(): Mem {
  const d = { ...seedData(), risk: [] as RiskEvent[] };
  const kamala = d.users.find((u) => u.id === DEMO_ELDER_ID);
  if (kamala) kamala.duress_hash = hashPin(DEMO_DURESS_PIN);
  return d;
}

function mem(): Mem {
  if (!g.__rukoMem) g.__rukoMem = memSeed();
  return g.__rukoMem;
}

function sb(): SupabaseClient {
  if (!g.__rukoSb) {
    g.__rukoSb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return g.__rukoSb;
}

type Res<T> = { data: T | null; error: { message: string } | null };

/** Throws on error; for writes that return nothing. */
function ok(res: { error: { message: string } | null }) {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
}
/** Throws on error or missing data. */
function must<T>(res: Res<T>): T {
  ok(res);
  if (res.data === null) throw new Error("Supabase: no data returned");
  return res.data;
}
/** Throws on error; null means no row. */
function maybe<T>(res: Res<T>): T | null {
  ok(res);
  return res.data;
}

const now = () => new Date().toISOString();

/** numeric columns come back as strings from Postgres; the app wants numbers. */
const toTransfer = (r: Transfer): Transfer => ({ ...r, amount: Number(r.amount) });

// ---------- demo seeding ----------

async function seedSupabase() {
  const d = seedData();
  const db = sb();
  // Family members the elder added during a demo are users too; collect them
  // before the cascade removes the circle rows that point at them.
  const added = maybe(await db.from("circles").select("member_id").in("elder_id", DEMO_USER_IDS)) ?? [];
  const ids = [...new Set([...DEMO_USER_IDS, ...added.map((r: { member_id: string }) => r.member_id)])];
  // Deleting the demo users cascades to everything that belongs to them.
  ok(await db.from("users").delete().in("id", ids));
  ok(await db.from("users").insert(d.users.map((u) => (u.id === DEMO_ELDER_ID ? { ...u, duress_hash: hashPin(DEMO_DURESS_PIN) } : u))));
  ok(await db.from("consents").insert(d.consents));
  ok(await db.from("payees").insert(d.payees));
  ok(await db.from("transfers").insert(d.transfers));
  ok(await db.from("call_signals").insert(d.signals));
  ok(await db.from("circles").insert(d.circles));
  ok(await db.from("protection").insert(d.protection));
}

/** Seeds Supabase once per server process if the demo elder is missing. */
async function ready() {
  if (!hasSupabase) return;
  g.__rukoSeeded ??= (async () => {
    const { data } = await sb().from("users").select("id").eq("id", DEMO_USER_IDS[0]).maybeSingle();
    if (!data) await seedSupabase();
  })().catch((e) => {
    g.__rukoSeeded = undefined;
    throw e;
  });
  await g.__rukoSeeded;
}

export async function resetDemo() {
  if (hasSupabase) {
    await seedSupabase();
    g.__rukoSeeded = Promise.resolve();
  } else {
    g.__rukoMem = memSeed();
    const sec = (globalThis as unknown as { __rukoSec?: { threat: Array<{ elder_id: string }>; intents: Array<{ elder_id: string }> } }).__rukoSec;
    if (sec) {
      sec.threat = sec.threat.filter((r) => !DEMO_USER_IDS.includes(r.elder_id));
      sec.intents = sec.intents.filter((r) => !DEMO_USER_IDS.includes(r.elder_id));
    }
  }
}

// ---------- reads and writes ----------

export async function getUser(userId: string): Promise<User | undefined> {
  if (!hasSupabase) return mem().users.find((u) => u.id === userId);
  await ready();
  return maybe(await sb().from("users").select("*").eq("id", userId).maybeSingle()) ?? undefined;
}

export async function hasConsent(userId: string, scope: ConsentScope) {
  if (!hasSupabase) return mem().consents.some((c) => c.user_id === userId && c.scope === scope && !c.revoked_at);
  await ready();
  const rows = must(
    await sb().from("consents").select("id").eq("user_id", userId).eq("scope", scope).is("revoked_at", null).limit(1),
  );
  return rows.length > 0;
}

export async function getSignals(elderId: string): Promise<CallSignals | undefined> {
  if (!hasSupabase) return mem().signals.find((s) => s.elder_id === elderId);
  await ready();
  return maybe(await sb().from("call_signals").select("*").eq("elder_id", elderId).maybeSingle()) ?? undefined;
}

export async function setSignals(elderId: string, patch: Partial<CallSignals>) {
  if (!hasSupabase) {
    const s = mem().signals.find((x) => x.elder_id === elderId);
    if (!s) throw new Error(`No signals row for ${elderId}`);
    return Object.assign(s, patch, { updated_at: now() });
  }
  await ready();
  return must(
    await sb()
      .from("call_signals")
      .upsert({ elder_id: elderId, ...patch, updated_at: now() })
      .select()
      .single(),
  ) as CallSignals;
}

export async function listPayees(elderId: string): Promise<Payee[]> {
  if (!hasSupabase) return mem().payees.filter((p) => p.elder_id === elderId);
  await ready();
  return must(await sb().from("payees").select("*").eq("elder_id", elderId).order("first_paid_at"));
}

export async function addPayee(p: Payee) {
  if (!hasSupabase) {
    if (!mem().payees.some((x) => x.elder_id === p.elder_id && x.account === p.account)) mem().payees.push(p);
    return;
  }
  await ready();
  ok(await sb().from("payees").upsert(p, { onConflict: "elder_id,account", ignoreDuplicates: true }));
}

export async function listTransfers(filter: { elderId?: string } = {}): Promise<Transfer[]> {
  if (!hasSupabase) {
    return mem()
      .transfers.filter((t) => !filter.elderId || t.elder_id === filter.elderId)
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
  }
  await ready();
  let q = sb().from("transfers").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter.elderId) q = q.eq("elder_id", filter.elderId);
  return must(await q).map(toTransfer);
}

export async function getTransfer(transferId: string): Promise<Transfer | undefined> {
  if (!hasSupabase) return mem().transfers.find((t) => t.id === transferId);
  await ready();
  const row = maybe(await sb().from("transfers").select("*").eq("id", transferId).maybeSingle());
  return row ? toTransfer(row) : undefined;
}

export async function createTransfer(
  t: Omit<Transfer, "id" | "created_at" | "decided_at" | "seeded">,
): Promise<Transfer> {
  if (!hasSupabase) {
    const row: Transfer = { ...t, id: crypto.randomUUID(), created_at: now(), decided_at: null, seeded: false };
    mem().transfers.push(row);
    return row;
  }
  await ready();
  return toTransfer(must(await sb().from("transfers").insert({ ...t, seeded: false }).select().single()));
}

export async function updateTransfer(transferId: string, patch: Partial<Transfer>) {
  if (!hasSupabase) {
    const t = mem().transfers.find((x) => x.id === transferId);
    return t ? Object.assign(t, patch) : undefined;
  }
  await ready();
  const row = maybe(await sb().from("transfers").update(patch).eq("id", transferId).select().maybeSingle());
  return row ? toTransfer(row) : undefined;
}

export async function addRiskEvent(e: Omit<RiskEvent, "id" | "created_at">): Promise<RiskEvent> {
  if (!hasSupabase) {
    const row: RiskEvent = { ...e, id: crypto.randomUUID(), created_at: now() };
    mem().risk.push(row);
    return row;
  }
  await ready();
  return must(await sb().from("risk_events").insert(e).select().single());
}

/** Ruko Companion: record what the elder just told Ruko on their latest alert (last 2 hours). A code, never words. */
export async function setElderStatus(elderId: string, status: string): Promise<RiskEvent | undefined> {
  const at = now();
  const since = new Date(Date.now() - 120 * 60_000).toISOString();
  if (!hasSupabase) {
    const latest = mem()
      .risk.filter((r) => r.elder_id === elderId && r.created_at >= since)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    if (!latest) return undefined;
    latest.elder_status = status;
    latest.elder_status_at = at;
    return latest;
  }
  await ready();
  const rows = must(
    await sb().from("risk_events").select("id").eq("elder_id", elderId).gte("created_at", since).order("created_at", { ascending: false }).limit(1),
  );
  if (!rows[0]) return undefined;
  return maybe(await sb().from("risk_events").update({ elder_status: status, elder_status_at: at }).eq("id", rows[0].id).select().maybeSingle()) ?? undefined;
}

/** The highest agent/signal risk score for this elder in the last `minutes`. */
export async function recentRisk(elderId: string, minutes = 60): Promise<RiskEvent | undefined> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  if (!hasSupabase) {
    return mem()
      .risk.filter((r) => r.elder_id === elderId && r.source !== "bank" && r.created_at >= since)
      .reduce<RiskEvent | undefined>((top, r) => (!top || r.score > top.score ? r : top), undefined);
  }
  await ready();
  const rows = must(
    await sb()
      .from("risk_events")
      .select("*")
      .eq("elder_id", elderId)
      .neq("source", "bank")
      .gte("created_at", since)
      .order("score", { ascending: false })
      .limit(1),
  );
  return rows[0];
}

/** This elder's recent warnings, newest first (for the home screen). */
export async function listRiskEvents(elderId: string, limit = 5): Promise<RiskEvent[]> {
  if (!hasSupabase) {
    return mem()
      .risk.filter((r) => r.elder_id === elderId && r.score > 0)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  await ready();
  return must(
    await sb()
      .from("risk_events")
      .select("*")
      .eq("elder_id", elderId)
      .gt("score", 0)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

// ---------- family safety circle ----------

export async function listCircle(elderId: string): Promise<{ members: CircleMember[]; codeWordSet: boolean }> {
  let rows: CircleRow[];
  let users: User[];
  if (!hasSupabase) {
    rows = mem().circles.filter((c) => c.elder_id === elderId);
    users = mem().users.filter((u) => rows.some((r) => r.member_id === u.id));
  } else {
    await ready();
    rows = must(await sb().from("circles").select("*").eq("elder_id", elderId));
    users = rows.length ? must(await sb().from("users").select("*").in("id", rows.map((r) => r.member_id))) : [];
  }
  const members = rows.flatMap((r) => {
    const u = users.find((x) => x.id === r.member_id);
    return u ? [{ id: u.id, name: u.name, phone: u.phone, relation: r.relation, trusted: r.trusted }] : [];
  });
  return { members, codeWordSet: rows.some((r) => r.code_word_hash) };
}

/**
 * Adds someone to the elder's Ruko Family. Only called once that person has
 * accepted their invite (DPDP: they consent to their own data). Pass
 * `existingUserId` when the person already has an account.
 */
export async function addCircleMember(
  elderId: string,
  m: { name: string; phone: string; relation: string },
  existingUserId?: string,
) {
  const existing = existingUserId ? await getUser(existingUserId) : undefined;
  const user: User = existing ?? { id: crypto.randomUUID(), name: m.name, phone: m.phone, language: "en", role: "family" };
  // A new member inherits the circle's code word, so every row stays in step.
  // The first person to join becomes the trusted person.
  const { members, codeWordSet } = await listCircle(elderId);
  const hash = codeWordSet ? await circleCodeWordHash(elderId) : null;
  const trusted = !members.some((x) => x.trusted);
  const row: CircleRow = { elder_id: elderId, member_id: user.id, relation: m.relation, code_word_hash: hash, trusted };
  if (!hasSupabase) {
    if (!existing) mem().users.push(user);
    mem().circles.push(row);
  } else {
    await ready();
    if (!existing) ok(await sb().from("users").insert(user));
    ok(await sb().from("circles").insert(row));
  }
  return { id: user.id, name: user.name, phone: user.phone, relation: m.relation, trusted } satisfies CircleMember;
}

export async function removeCircleMember(elderId: string, memberId: string) {
  if (!hasSupabase) {
    const m = mem();
    m.circles = m.circles.filter((c) => !(c.elder_id === elderId && c.member_id === memberId));
    if (!m.circles.some((c) => c.member_id === memberId)) {
      m.users = m.users.filter((u) => !(u.id === memberId && u.role === "family"));
    }
    return;
  }
  await ready();
  ok(await sb().from("circles").delete().eq("elder_id", elderId).eq("member_id", memberId));
  const others = must(await sb().from("circles").select("elder_id").eq("member_id", memberId).limit(1));
  if (others.length === 0) ok(await sb().from("users").delete().eq("id", memberId).eq("role", "family"));
}

async function circleCodeWordHash(elderId: string): Promise<string | null> {
  if (!hasSupabase) return mem().circles.find((c) => c.elder_id === elderId && c.code_word_hash)?.code_word_hash ?? null;
  const rows = must(
    await sb().from("circles").select("code_word_hash").eq("elder_id", elderId).not("code_word_hash", "is", null).limit(1),
  );
  return rows[0]?.code_word_hash ?? null;
}

export async function setCircleCodeWordHash(elderId: string, hash: string) {
  if (!hasSupabase) {
    for (const c of mem().circles) if (c.elder_id === elderId) c.code_word_hash = hash;
    return;
  }
  await ready();
  ok(await sb().from("circles").update({ code_word_hash: hash }).eq("elder_id", elderId));
}

export async function getCircleCodeWordHash(elderId: string) {
  await ready();
  return circleCodeWordHash(elderId);
}

// ---------- alerts ----------

export async function createAlerts(
  rows: Array<{ risk_event_id: string; member_id: string; channel: AlertChannel; message: string }>,
): Promise<Alert[]> {
  if (rows.length === 0) return [];
  if (!hasSupabase) {
    const made = rows.map((r) => ({ ...r, id: crypto.randomUUID(), status: "sent" as const, ts: now() }));
    mem().alerts.push(...made);
    return made;
  }
  await ready();
  return must(await sb().from("alerts").insert(rows).select());
}

export async function listAlerts(filter: { memberId?: string; riskEventId?: string }): Promise<Alert[]> {
  if (!hasSupabase) {
    return mem()
      .alerts.filter(
        (a) =>
          (!filter.memberId || a.member_id === filter.memberId) &&
          (!filter.riskEventId || a.risk_event_id === filter.riskEventId),
      )
      .toSorted((a, b) => b.ts.localeCompare(a.ts));
  }
  await ready();
  let q = sb().from("alerts").select("*").order("ts", { ascending: false }).limit(50);
  if (filter.memberId) q = q.eq("member_id", filter.memberId);
  if (filter.riskEventId) q = q.eq("risk_event_id", filter.riskEventId);
  return must(await q);
}

export async function getRiskEvent(id: string): Promise<RiskEvent | undefined> {
  if (!hasSupabase) return mem().risk.find((r) => r.id === id);
  await ready();
  return maybe(await sb().from("risk_events").select("*").eq("id", id).maybeSingle()) ?? undefined;
}

export async function updateAlert(alertId: string, status: AlertStatus): Promise<Alert | undefined> {
  if (!hasSupabase) {
    const a = mem().alerts.find((x) => x.id === alertId);
    return a ? Object.assign(a, { status }) : undefined;
  }
  await ready();
  return maybe(await sb().from("alerts").update({ status }).eq("id", alertId).select().maybeSingle()) ?? undefined;
}

/** Elders whose Ruko Family this person belongs to. */
export async function listEldersFor(memberId: string): Promise<CircleRow[]> {
  if (!hasSupabase) return mem().circles.filter((c) => c.member_id === memberId);
  await ready();
  return must(await sb().from("circles").select("*").eq("member_id", memberId));
}

// ---------- accounts ----------

export async function getUserByAuth(authId: string): Promise<User | undefined> {
  if (!hasSupabase) return mem().users.find((u) => u.auth_id === authId);
  await ready();
  return maybe(await sb().from("users").select("*").eq("auth_id", authId).maybeSingle()) ?? undefined;
}

export async function createUser(u: Omit<User, "id">): Promise<User> {
  const row: User = { ...u, id: crypto.randomUUID() };
  if (!hasSupabase) {
    mem().users.push(row);
    return row;
  }
  await ready();
  return must(await sb().from("users").insert(row).select().single());
}

export async function updateUser(userId: string, patch: Partial<Omit<User, "id">>) {
  if (!hasSupabase) {
    const u = mem().users.find((x) => x.id === userId);
    return u ? Object.assign(u, patch) : undefined;
  }
  await ready();
  return maybe(await sb().from("users").update(patch).eq("id", userId).select().maybeSingle()) ?? undefined;
}

// ---------- consent ----------

export async function listConsents(userId: string): Promise<Consent[]> {
  if (!hasSupabase) return mem().consents.filter((c) => c.user_id === userId && !c.revoked_at);
  await ready();
  return must(await sb().from("consents").select("*").eq("user_id", userId).is("revoked_at", null));
}

export async function grantConsent(c: Omit<Consent, "granted_at" | "revoked_at">) {
  if (await hasConsent(c.user_id, c.scope)) return;
  const row = { ...c, granted_at: now(), revoked_at: null };
  if (!hasSupabase) {
    mem().consents.push(row);
    return;
  }
  ok(await sb().from("consents").insert(row));
}

/** Withdrawing must be as easy as granting (DPDP). */
export async function revokeConsent(userId: string, scope: ConsentScope) {
  if (!hasSupabase) {
    for (const c of mem().consents) if (c.user_id === userId && c.scope === scope && !c.revoked_at) c.revoked_at = now();
    return;
  }
  await ready();
  ok(
    await sb()
      .from("consents")
      .update({ revoked_at: now() })
      .eq("user_id", userId)
      .eq("scope", scope)
      .is("revoked_at", null),
  );
}

// ---------- invites ----------

export async function createInvite(
  i: Omit<Invite, "id" | "created_at" | "expires_at" | "decided_at" | "status" | "member_id">,
): Promise<Invite> {
  const row: Invite = {
    ...i,
    id: crypto.randomUUID(),
    status: "pending",
    member_id: null,
    created_at: now(),
    expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    decided_at: null,
  };
  if (!hasSupabase) {
    mem().invites.push(row);
    return row;
  }
  await ready();
  return must(await sb().from("invites").insert(row).select().single()) as Invite;
}

export async function listInvites(elderId: string): Promise<Invite[]> {
  if (!hasSupabase) return mem().invites.filter((i) => i.elder_id === elderId && i.status === "pending");
  await ready();
  return must(await sb().from("invites").select("*").eq("elder_id", elderId).eq("status", "pending").order("created_at"));
}

export async function getInviteByHash(tokenHash: string): Promise<Invite | undefined> {
  if (!hasSupabase) return mem().invites.find((i) => i.token_hash === tokenHash);
  await ready();
  return maybe(await sb().from("invites").select("*").eq("token_hash", tokenHash).maybeSingle()) ?? undefined;
}

export async function updateInvite(inviteId: string, patch: Partial<Invite>) {
  if (!hasSupabase) {
    const i = mem().invites.find((x) => x.id === inviteId);
    return i ? Object.assign(i, patch) : undefined;
  }
  await ready();
  return maybe(await sb().from("invites").update(patch).eq("id", inviteId).select().maybeSingle()) ?? undefined;
}

// ---------- trusted-person approvals ----------

export async function createApprovals(transferId: string, memberIds: string[]): Promise<Approval[]> {
  if (memberIds.length === 0) return [];
  const rows: Approval[] = memberIds.map((member_id) => ({
    id: crypto.randomUUID(),
    transfer_id: transferId,
    member_id,
    status: "pending",
    created_at: now(),
    decided_at: null,
  }));
  if (!hasSupabase) {
    mem().approvals.push(...rows);
    return rows;
  }
  await ready();
  return must(await sb().from("approvals").insert(rows).select());
}

export async function listApprovals(filter: { memberId?: string; transferId?: string }): Promise<Approval[]> {
  if (!hasSupabase) {
    return mem()
      .approvals.filter(
        (a) =>
          (!filter.memberId || a.member_id === filter.memberId) &&
          (!filter.transferId || a.transfer_id === filter.transferId),
      )
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at));
  }
  await ready();
  let q = sb().from("approvals").select("*").order("created_at", { ascending: false }).limit(50);
  if (filter.memberId) q = q.eq("member_id", filter.memberId);
  if (filter.transferId) q = q.eq("transfer_id", filter.transferId);
  return must(await q);
}

export async function decideApproval(approvalId: string, status: Exclude<ApprovalStatus, "pending">) {
  const patch = { status, decided_at: now() };
  if (!hasSupabase) {
    const a = mem().approvals.find((x) => x.id === approvalId);
    return a ? Object.assign(a, patch) : undefined;
  }
  await ready();
  return (maybe(await sb().from("approvals").update(patch).eq("id", approvalId).select().maybeSingle()) as Approval | null) ?? undefined;
}

// ---------- protection (the hold that follows the elder) ----------

const noProtection = (elderId: string): Protection => ({
  elder_id: elderId,
  active: false,
  since: null,
  reason: null,
  cleared_by: null,
  cleared_at: null,
});

export async function getProtection(elderId: string): Promise<Protection> {
  if (!hasSupabase) return mem().protection.find((p) => p.elder_id === elderId) ?? noProtection(elderId);
  await ready();
  return (maybe(await sb().from("protection").select("*").eq("elder_id", elderId).maybeSingle()) as Protection | null) ?? noProtection(elderId);
}

export async function setProtection(elderId: string, patch: Partial<Omit<Protection, "elder_id">>): Promise<Protection> {
  if (!hasSupabase) {
    let p = mem().protection.find((x) => x.elder_id === elderId);
    if (!p) {
      p = noProtection(elderId);
      mem().protection.push(p);
    }
    return Object.assign(p, patch);
  }
  await ready();
  return must(await sb().from("protection").upsert({ elder_id: elderId, ...patch }).select().single()) as Protection;
}

/** The fixed deposit the elder broke in the last `hours`, if any (a digital-arrest money-raising signal). */
export async function recentFdBreak(elderId: string, hours = 24) {
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();
  return (await listTransfers({ elderId })).find((t) => t.channel === "fd_break" && t.created_at >= since);
}

export async function getAlert(alertId: string): Promise<Alert | undefined> {
  if (!hasSupabase) return mem().alerts.find((a) => a.id === alertId);
  await ready();
  return (maybe(await sb().from("alerts").select("*").eq("id", alertId).maybeSingle()) as Alert | null) ?? undefined;
}

export async function getApproval(approvalId: string): Promise<Approval | undefined> {
  if (!hasSupabase) return mem().approvals.find((a) => a.id === approvalId);
  await ready();
  return (maybe(await sb().from("approvals").select("*").eq("id", approvalId).maybeSingle()) as Approval | null) ?? undefined;
}

// ---------- Scam Radar: pattern library (remote config) ----------

/** The live library: active rows from scam_patterns, seeded from the bundled JSON the first time. */
export async function loadPatternLibrary(): Promise<PatternLibrary> {
  if (!hasSupabase) return BUNDLED_LIBRARY;
  await ready();
  let rows = must(await sb().from("scam_patterns").select("id, version, data").eq("active", true));
  if (rows.length === 0) {
    ok(
      await sb()
        .from("scam_patterns")
        .upsert(BUNDLED_LIBRARY.patterns.map((p) => ({ id: p.id, version: BUNDLED_LIBRARY.version, data: p }))),
    );
    rows = BUNDLED_LIBRARY.patterns.map((p) => ({ id: p.id, version: BUNDLED_LIBRARY.version, data: p }));
  } else if (BUNDLED_LIBRARY.version > Math.max(...rows.map((r: { version: number }) => r.version))) {
    // The app shipped a newer library than the database holds: bring those patterns up to date
    // (patterns that exist only in the database are left alone).
    const upgraded = BUNDLED_LIBRARY.patterns.map((p) => ({ id: p.id, version: BUNDLED_LIBRARY.version, data: p }));
    ok(await sb().from("scam_patterns").upsert(upgraded));
    const kept = rows.filter((r: { id: string }) => !upgraded.some((u) => u.id === r.id));
    rows = [...upgraded, ...kept];
  }
  return {
    version: Math.max(...rows.map((r: { version: number }) => r.version)),
    patterns: rows.map((r: { data: ScamPattern }) => r.data),
  };
}

// ---------- Survey bot ----------

export interface SurveyRecord {
  id: string;
  kind: SurveyKind;
  call_id: string | null;
  participant_id: string | null;
  arm: "baseline" | "ruko" | "control" | null;
  is_scam: boolean | null;
  lang: "en" | "hing";
  answers: Answers;
  created_at: string;
}

const g3 = globalThis as unknown as { __rukoSurveys?: SurveyRecord[] };
const memSurveys = () => (g3.__rukoSurveys ??= []);

/** Keep one answer set per survey: the open link may be answered many times, a call's survey replaces the earlier one. */
export async function addSurveyResponse(r: Omit<SurveyRecord, "id" | "created_at">): Promise<SurveyRecord> {
  if (!hasSupabase) {
    const row: SurveyRecord = { ...r, id: crypto.randomUUID(), created_at: now() };
    if (r.call_id) g3.__rukoSurveys = memSurveys().filter((x) => !(x.call_id === r.call_id && x.kind === r.kind));
    memSurveys().push(row);
    return row;
  }
  await ready();
  if (r.call_id) ok(await sb().from("survey_responses").delete().eq("call_id", r.call_id).eq("kind", r.kind));
  return must(await sb().from("survey_responses").insert(r).select().single());
}

export async function listSurveyResponses(): Promise<SurveyRecord[]> {
  if (!hasSupabase) return [...memSurveys()].sort((a, b) => b.created_at.localeCompare(a.created_at));
  await ready();
  return must(await sb().from("survey_responses").select("*").order("created_at", { ascending: false }).limit(5000));
}

// ---------- Scam Radar: community number reports ----------

export interface NumberReportRow {
  number_hash: string;
  verdict: "scam" | "not_scam" | "unsure";
  pattern_id: string | null;
  reporter_hash: string;
  demo: boolean;
}

const g2 = globalThis as unknown as { __rukoReports?: Array<NumberReportRow & { created_at: string }>; __rukoEvents?: EventRow[] };
const memReports = () => (g2.__rukoReports ??= []);

/** One report per reporter per number; a later answer replaces the earlier one. */
export async function upsertNumberReport(r: NumberReportRow) {
  if (!hasSupabase) {
    const list = memReports();
    const i = list.findIndex((x) => x.number_hash === r.number_hash && x.reporter_hash === r.reporter_hash);
    const row = { ...r, created_at: now() };
    if (i >= 0) list[i] = row;
    else list.push(row);
    return;
  }
  await ready();
  ok(await sb().from("number_reports").upsert({ ...r, created_at: now() }, { onConflict: "number_hash,reporter_hash" }));
}

export async function summarizeNumberReports(numberHash: string, includeDemo: boolean) {
  let rows: Array<{ verdict: string; pattern_id: string | null }>;
  if (!hasSupabase) {
    rows = memReports().filter((r) => r.number_hash === numberHash && (includeDemo || !r.demo));
  } else {
    await ready();
    let q = sb().from("number_reports").select("verdict, pattern_id").eq("number_hash", numberHash).limit(5000);
    if (!includeDemo) q = q.eq("demo", false);
    rows = must(await q);
  }
  const counts = new Map<string, number>();
  for (const r of rows) if (r.verdict === "scam" && r.pattern_id) counts.set(r.pattern_id, (counts.get(r.pattern_id) ?? 0) + 1);
  const topPattern = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    scam: rows.filter((r) => r.verdict === "scam").length,
    notScam: rows.filter((r) => r.verdict === "not_scam").length,
    unsure: rows.filter((r) => r.verdict === "unsure").length,
    topPattern,
  };
}

export async function insertNumberReports(rows: NumberReportRow[]) {
  if (rows.length === 0) return;
  if (!hasSupabase) {
    memReports().push(...rows.map((r) => ({ ...r, created_at: now() })));
    return;
  }
  await ready();
  ok(await sb().from("number_reports").upsert(rows, { onConflict: "number_hash,reporter_hash", ignoreDuplicates: true }));
}

export async function deleteDemoNumberReports() {
  if (!hasSupabase) {
    g2.__rukoReports = memReports().filter((r) => !r.demo);
    return;
  }
  await ready();
  ok(await sb().from("number_reports").delete().eq("demo", true));
}

// ---------- anonymous metrics ----------

export type EventKind =
  | "scam_flagged"
  | "stop_shown"
  | "money_lock_triggered"
  | "payment_abandoned"
  | "false_positive"
  | "confirmed_scam"
  | "time_to_warning"
  | "emergency_opened";

export interface EventRow {
  kind: EventKind;
  value: number | null;
  pattern_id: string | null;
  demo: boolean;
  created_at?: string;
}

const memEvents = () => (g2.__rukoEvents ??= []);

/** No user id and no phone number, ever: only what happened, and how much. */
export async function insertEvent(e: EventRow) {
  if (!hasSupabase) {
    memEvents().push({ ...e, created_at: now() });
    return;
  }
  await ready();
  ok(await sb().from("events").insert(e));
}

export async function listEvents(since: string, includeDemo: boolean): Promise<EventRow[]> {
  if (!hasSupabase) return memEvents().filter((e) => (e.created_at ?? "") >= since && (includeDemo || !e.demo));
  await ready();
  let q = sb().from("events").select("kind, value, pattern_id, demo, created_at").gte("created_at", since).limit(20000);
  if (!includeDemo) q = q.eq("demo", false);
  return must(await q);
}

export async function deleteDemoEvents() {
  if (!hasSupabase) {
    g2.__rukoEvents = memEvents().filter((e) => !e.demo);
    return;
  }
  await ready();
  ok(await sb().from("events").delete().eq("demo", true));
}

// ---------- settings and deletion ----------

/** "Delete my data": the person and everything that hangs off them (cascades). */
export async function deleteUserCompletely(userId: string) {
  if (!hasSupabase) {
    const m = mem();
    m.users = m.users.filter((u) => u.id !== userId);
    m.circles = m.circles.filter((c) => c.elder_id !== userId && c.member_id !== userId);
    m.consents = m.consents.filter((c) => c.user_id !== userId);
    return;
  }
  await ready();
  ok(await sb().from("users").delete().eq("id", userId));
}

export async function deleteAuthLogin(authId: string) {
  if (!hasSupabase) return;
  const { error } = await sb().auth.admin.deleteUser(authId);
  if (error) throw new Error(`Supabase: ${error.message}`);
}

// ---------- trial lab ----------
// Pseudonymous participants (P01 …), their planned and finished calls, and a
// practice account each. Seeded (illustrative) rows carry `seeded: true`.

type TrialMem = { participants: Participant[]; calls: TrialCall[] };
const gt = globalThis as unknown as { __rukoTrial?: TrialMem };
const tmem = () => (gt.__rukoTrial ??= { participants: [], calls: [] });

const toCall = (r: TrialCall): TrialCall => ({
  ...r,
  live: r.live ?? {},
  step_times: r.step_times ?? {},
  events: r.events ?? [],
  level_edit_log: r.level_edit_log ?? [],
});

export async function listParticipants(): Promise<Participant[]> {
  if (!hasSupabase) return [...tmem().participants].sort((a, b) => a.code.localeCompare(b.code));
  return must(await sb().from("participants").select("*").order("code"));
}

export async function getParticipant(id: string): Promise<Participant | undefined> {
  if (!hasSupabase) return tmem().participants.find((p) => p.id === id);
  return maybe(await sb().from("participants").select("*").eq("id", id).maybeSingle()) ?? undefined;
}

export async function createParticipant(p: Omit<Participant, "id" | "created_at">): Promise<Participant> {
  if (!hasSupabase) {
    const row: Participant = { ...p, id: crypto.randomUUID(), created_at: now() };
    tmem().participants.push(row);
    return row;
  }
  return must(await sb().from("participants").insert(p).select().single());
}

export async function updateParticipant(id: string, patch: Partial<Participant>): Promise<Participant | undefined> {
  if (!hasSupabase) {
    const p = tmem().participants.find((x) => x.id === id);
    return p ? Object.assign(p, patch) : undefined;
  }
  return maybe(await sb().from("participants").update(patch).eq("id", id).select().maybeSingle()) ?? undefined;
}

export async function deleteParticipant(id: string) {
  const p = await getParticipant(id);
  if (!hasSupabase) {
    tmem().participants = tmem().participants.filter((x) => x.id !== id);
    tmem().calls = tmem().calls.filter((c) => c.participant_id !== id);
    g3.__rukoSurveys = memSurveys().filter((r) => r.participant_id !== id);
  } else {
    ok(await sb().from("participants").delete().eq("id", id));
  }
  if (p?.account_id) await deletePracticeAccount(p.account_id);
}

export async function listTrialCalls(filter: { participantId?: string } = {}): Promise<TrialCall[]> {
  if (!hasSupabase) {
    return tmem()
      .calls.filter((c) => !filter.participantId || c.participant_id === filter.participantId)
      .sort((a, b) => a.order_no - b.order_no);
  }
  let q = sb().from("trial_calls").select("*").order("order_no");
  if (filter.participantId) q = q.eq("participant_id", filter.participantId);
  return must(await q).map(toCall);
}

export async function getTrialCall(id: string): Promise<TrialCall | undefined> {
  if (!hasSupabase) return tmem().calls.find((c) => c.id === id);
  const row = maybe(await sb().from("trial_calls").select("*").eq("id", id).maybeSingle());
  return row ? toCall(row) : undefined;
}

type NewCall = Partial<TrialCall> & Pick<TrialCall, "participant_id" | "order_no" | "arm" | "script_id" | "is_scam">;

export async function createTrialCalls(rows: NewCall[]): Promise<TrialCall[]> {
  if (!rows.length) return [];
  if (!hasSupabase) {
    const made = rows.map(
      (r) =>
        ({
          channel: "browser",
          lang: "en",
          family_present: false,
          status: "ready",
          live: {},
          started_at: null,
          ended_at: null,
          furthest_step: null,
          step_times: {},
          stopped_by: null,
          time_to_stop_s: null,
          ruko_used: null,
          ruko_level: null,
          family_alerted: null,
          bank_held: null,
          participant_refused: null,
          stress: null,
          confidence: null,
          debriefed: false,
          notes: null,
          block: null,
          money_moved: null,
          control_outcome: null,
          belief_real: null,
          stress_pre: null,
          stress_after: null,
          adverse_event_level: null,
          deviation: null,
          facilitator_in_room: true,
          t_money_ask_s: null,
          events: [],
          level_edit_log: [],
          seeded: false,
          created_at: now(),
          ...r,
          id: r.id ?? crypto.randomUUID(),
        }) as TrialCall,
    );
    tmem().calls.push(...made);
    return made;
  }
  return must(await sb().from("trial_calls").insert(rows).select()).map(toCall);
}

export async function updateTrialCall(id: string, patch: Partial<TrialCall>): Promise<TrialCall | undefined> {
  if (!hasSupabase) {
    const c = tmem().calls.find((x) => x.id === id);
    return c ? Object.assign(c, patch) : undefined;
  }
  const row = maybe(await sb().from("trial_calls").update(patch).eq("id", id).select().maybeSingle());
  return row ? toCall(row) : undefined;
}

/** Removes the seeded (illustrative) participants and their calls. */
export async function deleteSeededTrial() {
  if (!hasSupabase) {
    const ids = new Set(tmem().participants.filter((p) => p.seeded).map((p) => p.id));
    tmem().participants = tmem().participants.filter((p) => !p.seeded);
    tmem().calls = tmem().calls.filter((c) => !ids.has(c.participant_id));
    return;
  }
  ok(await sb().from("participants").delete().eq("seeded", true));
}

export async function createPracticeAccount(accountId: string, familyId: string, code: string, birthYear: number) {
  const d = practiceAccount(accountId, familyId, code, birthYear);
  if (!hasSupabase) {
    const m = mem();
    m.users.push(...d.users);
    m.consents.push(...d.consents);
    m.payees.push(...d.payees);
    m.transfers.push(...d.transfers);
    m.signals.push(...d.signals);
    m.circles.push(...d.circles);
    m.protection.push(...d.protection);
    return;
  }
  await ready();
  const db = sb();
  ok(await db.from("users").insert(d.users));
  ok(await db.from("consents").insert(d.consents));
  ok(await db.from("payees").insert(d.payees));
  ok(await db.from("transfers").insert(d.transfers));
  ok(await db.from("call_signals").insert(d.signals));
  ok(await db.from("circles").insert(d.circles));
  ok(await db.from("protection").insert(d.protection));
}

async function deletePracticeAccount(accountId: string) {
  const familyId = familyIdFor(accountId);
  if (!hasSupabase) {
    const m = mem();
    const gone = (id: string) => id === accountId || id === familyId;
    m.users = m.users.filter((u) => !gone(u.id));
    m.transfers = m.transfers.filter((t) => !gone(t.elder_id));
    m.payees = m.payees.filter((p) => !gone(p.elder_id));
    m.risk = m.risk.filter((r) => !gone(r.elder_id));
    return;
  }
  ok(await sb().from("users").delete().in("id", [accountId, familyId]));
}

/**
 * Before each call: a clean practice account, so one call can't leak into the
 * next (no protection hold, no earlier warnings, no new payees, no held money).
 * Ruko is switched off for baseline calls.
 */
export async function resetPracticeAccount(accountId: string, code: string, birthYear: number, rukoEnabled: boolean) {
  const familyId = familyIdFor(accountId);
  const d = practiceAccount(accountId, familyId, code, birthYear);
  if (!hasSupabase) {
    const m = mem();
    m.transfers = [...m.transfers.filter((t) => t.elder_id !== accountId), ...d.transfers];
    m.payees = [...m.payees.filter((p) => p.elder_id !== accountId), ...d.payees];
    m.risk = m.risk.filter((r) => r.elder_id !== accountId);
    smem().threat = smem().threat.filter((r) => r.elder_id !== accountId);
    smem().intents = smem().intents.filter((r) => r.elder_id !== accountId);
    m.protection = [...m.protection.filter((p) => p.elder_id !== accountId), ...d.protection];
    const u = m.users.find((x) => x.id === accountId);
    if (u) u.ruko_enabled = rukoEnabled;
    return;
  }
  await ready();
  const db = sb();
  // Approvals and alerts cascade from transfers and risk events. The threat log
  // starts a fresh chain: one practice call must not colour the next.
  ok(await db.from("threat_events").delete().eq("elder_id", accountId));
  ok(await db.from("call_intents").delete().eq("elder_id", accountId));
  ok(await db.from("transfers").delete().eq("elder_id", accountId));
  ok(await db.from("risk_events").delete().eq("elder_id", accountId));
  ok(await db.from("payees").delete().eq("elder_id", accountId));
  ok(await db.from("transfers").insert(d.transfers));
  ok(await db.from("payees").insert(d.payees));
  ok(await db.from("protection").upsert(d.protection));
  ok(await db.from("users").update({ ruko_enabled: rukoEnabled }).eq("id", accountId));
}

/**
 * What the app itself logged for this practice account during the current
 * call. Every call starts with resetPracticeAccount, so "everything that isn't
 * seeded" is exactly this call (no clock comparison between laptop and database).
 */
export async function practiceActivity(accountId: string) {
  if (!hasSupabase) {
    const m = mem();
    const risk = m.risk.filter((r) => r.elder_id === accountId);
    return {
      transfers: m.transfers.filter((t) => t.elder_id === accountId && !t.seeded),
      risk,
      alerts: m.alerts.filter((a) => risk.some((r) => r.id === a.risk_event_id)),
    };
  }
  await ready();
  const db = sb();
  const [transfers, risk] = await Promise.all([
    db.from("transfers").select("*").eq("elder_id", accountId).eq("seeded", false).order("created_at"),
    db.from("risk_events").select("*").eq("elder_id", accountId).order("created_at"),
  ]);
  const riskRows = must(risk) as RiskEvent[];
  const alerts = riskRows.length ? must(await db.from("alerts").select("*").in("risk_event_id", riskRows.map((r) => r.id))) : [];
  return { transfers: (must(transfers) as Transfer[]).map(toTransfer), risk: riskRows, alerts: alerts as Alert[] };
}

// ---------- threat engine, verified calls, mule intelligence ----------
// The threat log is a per-person hash chain (lib/integrity.ts).

export interface ThreatEventRow {
  id: string;
  elder_id: string;
  at: string;
  kind: "observation" | "action";
  source: string;
  tactic: string | null;
  action: string | null;
  lr: number | null;
  evidence: string | null;
  demo: boolean;
  prev_hash: string;
  hash: string;
}
export type NewThreatEvent = Pick<ThreatEventRow, "kind" | "source"> & Partial<Pick<ThreatEventRow, "tactic" | "action" | "lr" | "evidence" | "at">>;

export interface CallIntentRow {
  id: string;
  elder_id: string;
  org: string;
  payload: Record<string, unknown>;
  sig: string;
  created_at: string;
  expires_at: string;
  ended_at: string | null;
  confirmed_at?: string | null;
  code_match?: boolean | null;
}

export interface MuleReportRow {
  account_hash: string;
  reporter_hash: string;
  pattern_id: string | null;
  demo: boolean;
  created_at?: string;
}

type SecMem = { threat: ThreatEventRow[]; intents: CallIntentRow[]; mules: MuleReportRow[] };
const gs = globalThis as unknown as { __rukoSec?: SecMem };
const smem = () => (gs.__rukoSec ??= { threat: [], intents: [], mules: [] });

/**
 * The fields a threat event's hash covers, normalised so the hash is the same
 * before and after a database round trip (Postgres returns "+00:00" for "Z"
 * and numerics as strings).
 */
export const threatFields = (r: Omit<ThreatEventRow, "id" | "prev_hash" | "hash">) => ({
  elder_id: r.elder_id,
  at: new Date(r.at).toISOString(),
  kind: r.kind,
  source: r.source,
  tactic: r.tactic,
  action: r.action,
  lr: r.lr === null ? null : Number(r.lr),
  evidence: r.evidence,
  demo: r.demo,
});

const toThreat = (r: ThreatEventRow): ThreatEventRow => ({ ...r, lr: r.lr === null ? null : Number(r.lr) });

export async function listThreatEvents(elderId: string, sinceIso?: string): Promise<ThreatEventRow[]> {
  if (!hasSupabase) {
    return smem()
      .threat.filter((r) => r.elder_id === elderId && (!sinceIso || r.at >= sinceIso))
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  await ready();
  let q = sb().from("threat_events").select("*").eq("elder_id", elderId).order("at").order("id");
  if (sinceIso) q = q.gte("at", sinceIso);
  return (must(await q) as ThreatEventRow[]).map(toThreat);
}

/**
 * Appends events to this person's hash chain, in order. Two writers that read
 * the same head collide on the unique (elder_id, prev_hash) constraint instead
 * of forking the chain; the loser re-reads the head and tries again.
 */
export async function appendThreatEvents(elderId: string, events: NewThreatEvent[], demo: boolean): Promise<ThreatEventRow[]> {
  if (!events.length) return [];
  for (let attempt = 0; ; attempt++) {
    try {
      return await appendOnce(elderId, events, demo);
    } catch (e) {
      if (!(e instanceof ChainConflict) || attempt >= 6) throw e;
      await new Promise((r) => setTimeout(r, 15 + Math.random() * 40));
    }
  }
}

class ChainConflict extends Error {}

async function appendOnce(elderId: string, events: NewThreatEvent[], demo: boolean): Promise<ThreatEventRow[]> {
  const chain = await listThreatEvents(elderId);
  let prev = chain.at(-1)?.hash ?? GENESIS;
  // Strictly increasing times keep the chain order stable even within one millisecond.
  let last = chain.at(-1)?.at ? Date.parse(chain.at(-1)!.at) : 0;
  const rows: ThreatEventRow[] = events.map((e) => {
    const t = Math.max(e.at ? Date.parse(e.at) : Date.now(), last + 1);
    last = t;
    const base = {
      elder_id: elderId,
      at: new Date(t).toISOString(),
      kind: e.kind,
      source: e.source,
      tactic: e.tactic ?? null,
      action: e.action ?? null,
      lr: e.lr ?? null,
      evidence: e.evidence ?? null,
      demo,
    };
    const hash = chainHash(prev, threatFields(base));
    const row = { ...base, id: crypto.randomUUID(), prev_hash: prev, hash };
    prev = hash;
    return row;
  });
  if (!hasSupabase) {
    smem().threat.push(...rows);
    return rows;
  }
  const res = await sb().from("threat_events").insert(rows);
  if (res.error && (res.error as { code?: string }).code === "23505") throw new ChainConflict(res.error.message);
  ok(res);
  return rows;
}

export async function verifyThreatChain(elderId: string) {
  return verifyChain(await listThreatEvents(elderId), (r) => threatFields(r));
}

export async function insertCallIntent(row: Omit<CallIntentRow, "created_at" | "ended_at">): Promise<CallIntentRow> {
  const full: CallIntentRow = { ...row, created_at: now(), ended_at: null };
  if (!hasSupabase) {
    smem().intents.push(full);
    return full;
  }
  await ready();
  return must(await sb().from("call_intents").insert(full).select().single());
}

export async function listActiveCallIntents(elderId: string): Promise<CallIntentRow[]> {
  const nowIso = now();
  if (!hasSupabase) return smem().intents.filter((i) => i.elder_id === elderId && !i.ended_at && i.expires_at > nowIso);
  await ready();
  return must(await sb().from("call_intents").select("*").eq("elder_id", elderId).is("ended_at", null).gt("expires_at", nowIso).order("created_at"));
}

export async function endCallIntent(id: string) {
  if (!hasSupabase) {
    const i = smem().intents.find((x) => x.id === id);
    if (i) i.ended_at = now();
    return;
  }
  ok(await sb().from("call_intents").update({ ended_at: now() }).eq("id", id));
}

export async function insertMuleReports(rows: MuleReportRow[]) {
  if (!rows.length) return;
  if (!hasSupabase) {
    for (const r of rows) {
      if (!smem().mules.some((m) => m.account_hash === r.account_hash && m.reporter_hash === r.reporter_hash)) smem().mules.push({ ...r, created_at: now() });
    }
    return;
  }
  ok(await sb().from("mule_reports").upsert(rows, { onConflict: "account_hash,reporter_hash", ignoreDuplicates: true }));
}

export async function deleteDemoMuleReports() {
  if (!hasSupabase) {
    smem().mules = smem().mules.filter((m) => !m.demo);
    return;
  }
  ok(await sb().from("mule_reports").delete().eq("demo", true));
}

/**
 * What the bank knows about a destination account, by salted hash:
 * community reports, and how many different customers were stopped
 * paying it as a likely scam in the last `days`.
 */
export async function payeeIntel(payeeHash: string, excludeElderId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  if (!hasSupabase) {
    const reports = smem().mules.filter((m) => m.account_hash === payeeHash).length;
    const victims = new Set(
      mem()
        .transfers.filter((t) => t.payee_hash === payeeHash && t.flagged && t.elder_id !== excludeElderId && t.created_at >= since)
        .map((t) => t.elder_id),
    );
    return { reports, victims: victims.size };
  }
  await ready();
  const [r, t] = await Promise.all([
    sb().from("mule_reports").select("id", { count: "exact", head: true }).eq("account_hash", payeeHash),
    sb().from("transfers").select("elder_id").eq("payee_hash", payeeHash).eq("flagged", true).neq("elder_id", excludeElderId).gte("created_at", since),
  ]);
  ok(r);
  const victims = new Set((must(t) as Array<{ elder_id: string }>).map((x) => x.elder_id));
  return { reports: r.count ?? 0, victims: victims.size };
}

/** The fraud desk's mule watch: destination accounts with several flagged payers or reports. */
export async function muleClusters(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  let flagged: Array<Pick<Transfer, "payee_hash" | "payee_account" | "elder_id" | "amount" | "created_at">>;
  let reports: MuleReportRow[];
  if (!hasSupabase) {
    flagged = mem().transfers.filter((t) => t.payee_hash && t.flagged && t.created_at >= since);
    reports = smem().mules;
  } else {
    await ready();
    const [t, r] = await Promise.all([
      sb().from("transfers").select("payee_hash,payee_account,elder_id,amount,created_at").eq("flagged", true).not("payee_hash", "is", null).gte("created_at", since),
      sb().from("mule_reports").select("account_hash,reporter_hash,pattern_id,demo"),
    ]);
    flagged = (must(t) as typeof flagged).map((x) => ({ ...x, amount: Number(x.amount) }));
    reports = must(r) as MuleReportRow[];
  }
  const map = new Map<string, { hash: string; account: string; victims: Set<string>; attempted: number; reports: number; last: string }>();
  for (const t of flagged) {
    const k = t.payee_hash as string;
    const e = map.get(k) ?? { hash: k, account: t.payee_account, victims: new Set<string>(), attempted: 0, reports: 0, last: t.created_at };
    e.victims.add(t.elder_id);
    e.attempted += t.amount;
    if (t.created_at > e.last) e.last = t.created_at;
    map.set(k, e);
  }
  for (const r of reports) {
    const e = map.get(r.account_hash);
    if (e) e.reports++;
  }
  const reportOnly = new Map<string, number>();
  for (const r of reports) if (!map.has(r.account_hash)) reportOnly.set(r.account_hash, (reportOnly.get(r.account_hash) ?? 0) + 1);
  return {
    clusters: [...map.values()]
      .map((e) => ({ hash: e.hash, account: e.account, victims: e.victims.size, attempted: e.attempted, reports: e.reports, last: e.last }))
      .sort((a, b) => b.victims - a.victims || b.reports - a.reports),
    reportedOnly: reportOnly.size,
  };
}

/** PIN state for the practice bank (server only: these hashes never leave the server). */
export async function getPinState(userId: string) {
  const u = await getUser(userId);
  return u
    ? { pin_hash: u.pin_hash ?? null, duress_hash: u.duress_hash ?? null, pin_fails: u.pin_fails ?? 0, pin_locked_until: u.pin_locked_until ?? null }
    : null;
}

/** H2: count a wrong PIN atomically (no read-then-write race). Returns the new state. */
export async function recordPinFailure(userId: string, maxTries: number, lockMinutes: number): Promise<{ fails: number; lockedUntil: string | null }> {
  if (!hasSupabase) {
    const u = mem().users.find((x) => x.id === userId);
    if (!u) return { fails: 0, lockedUntil: null };
    const fails = (u.pin_fails ?? 0) + 1;
    if (fails >= maxTries) {
      u.pin_fails = 0;
      u.pin_locked_until = new Date(Date.now() + lockMinutes * 60_000).toISOString();
      return { fails: maxTries, lockedUntil: u.pin_locked_until };
    }
    u.pin_fails = fails;
    return { fails, lockedUntil: null };
  }
  const rows = must(await sb().rpc("ruko_pin_fail", { uid: userId, max_tries: maxTries, lock_minutes: lockMinutes })) as Array<{ fails: number; locked_until: string | null }>;
  const r = rows[0] ?? { fails: 0, locked_until: null };
  const locked = r.locked_until && Date.parse(r.locked_until) > Date.now() ? r.locked_until : null;
  return { fails: r.fails, lockedUntil: locked };
}

export async function getCallIntent(id: string): Promise<(CallIntentRow & { confirmed_at?: string | null; code_match?: boolean | null }) | undefined> {
  if (!hasSupabase) return smem().intents.find((i) => i.id === id);
  await ready();
  return maybe(await sb().from("call_intents").select("*").eq("id", id).maybeSingle()) ?? undefined;
}

/** M2: the person confirmed (or denied) that the caller read out the right code. */
export async function confirmCallIntent(id: string, match: boolean) {
  const patch = { confirmed_at: now(), code_match: match };
  if (!hasSupabase) {
    const i = smem().intents.find((x) => x.id === id) as (CallIntentRow & typeof patch) | undefined;
    if (i) Object.assign(i, patch);
    return;
  }
  ok(await sb().from("call_intents").update(patch).eq("id", id));
}
