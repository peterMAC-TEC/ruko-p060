"use client";

import { BarChart3, Check, ClipboardCopy, FlaskConical, Phone, Play, ShieldCheck, Trash2, UserMinus, UserPlus, QrCode } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { AGE_BANDS, CONTROL_LABEL, SCALE, type Participant, type TrialCall } from "@/lib/trial";

// The facilitator's home for the pilot: enrol participants (pseudonymous
// codes only), see each person's counterbalanced plan, open a call.

/** "Scam · with Ruko", "Control · without Ruko" … */
export function armLabel(call: Pick<TrialCall, "arm" | "is_scam">): { label: string; cls: string } {
  const arm = call.arm === "baseline" ? "without Ruko" : "with Ruko";
  if (!call.is_scam) return { label: `Control · ${arm}`, cls: "bg-gold-soft text-warn" };
  return { label: `Scam · ${arm}`, cls: call.arm === "baseline" ? "bg-ink text-white" : "bg-calm text-white" };
}

export function LabHome({ titles }: { titles: Record<string, string> }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [calls, setCalls] = useState<TrialCall[]>([]);
  const [showSeeded, setShowSeeded] = useState(false);
  const [form, setForm] = useState({
    age_band: "70-74",
    language: "en",
    phone_type: "smartphone",
    uses_upi: true,
    lives_alone: false,
    family_present_default: false,
    gender: "na",
    prior_awareness: false,
    self_efficacy_pre: 3,
    teachback_attempts: 1,
    consent_signed: false,
    teachback_passed: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/lab/participants", { cache: "no-store" });
    if (!r.ok) return setError((await r.json().catch(() => null))?.error ?? "Couldn't load the lab.");
    const d = await r.json();
    setParticipants(d.participants);
    setCalls(d.calls);
  }, []);

  useEffect(() => {
    // Initial load, then a gentle poll so finished calls show up.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(() => {});
    const id = setInterval(() => load().catch(() => {}), 5000);
    return () => clearInterval(id);
  }, [load]);

  const enrol = async () => {
    setBusy(true);
    setError("");
    const r = await fetch("/api/lab/participants", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!r.ok) return setError((await r.json().catch(() => null))?.error ?? "Couldn't enrol.");
    setForm((f) => ({ ...f, consent_signed: false, teachback_passed: false, teachback_attempts: 1 }));
    load();
  };

  const act = async (p: Participant, what: "withdraw" | "delete") => {
    if (what === "delete" && !confirm(`Delete ${p.code} and every call they made? Use this when someone asks for their data to be erased.`)) return;
    await fetch(`/api/lab/participants/${p.id}`, {
      method: what === "delete" ? "DELETE" : "PATCH",
      headers: { "content-type": "application/json" },
      body: what === "delete" ? undefined : JSON.stringify({ withdraw: !p.withdrawn_at }),
    });
    load();
  };

  const seed = async (on: boolean) => {
    await fetch("/api/lab/seed", { method: on ? "POST" : "DELETE" });
    load();
  };

  const copyLink = async (p: Participant) => {
    const url = `${location.origin}/lab/device/${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(p.id);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      prompt("Open this on the participant's phone:", url);
    }
  };

  const shown = participants.filter((p) => p.seeded === showSeeded);
  const real = participants.filter((p) => !p.seeded);
  const realCalls = calls.filter((c) => real.some((p) => p.id === c.participant_id));
  const finished = realCalls.filter((c) => c.status === "ended").length;

  return (
    <div className="min-h-[100dvh] bg-paper-2 text-ink">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RukoWordmark />
            <span className="rounded-full bg-ink px-3 py-1 text-[13px] font-bold tracking-wide text-white uppercase">Trial lab</span>
          </div>
          <nav className="flex gap-2">
            <Link href="/survey/share" target="ruko-survey-qr" className="flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-bold shadow-soft">
              <QrCode className="size-4 text-calm" /> Survey QR
            </Link>
            <Link href="/results" className="flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-bold shadow-soft">
              <BarChart3 className="size-4 text-calm" /> Results
            </Link>
          </nav>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <section>
            <h1 className="text-[30px] leading-tight font-bold tracking-tight">Feasibility pilot</h1>
            <p className="mt-1 max-w-2xl text-[16px] text-ink-soft">
              Each person gets two blocks at least 48 h apart: one <b>without Ruko</b> and one <b>with Ruko</b> (order set by their allocation row),
              each with one role-played scam and one genuine control call. Money only moves on the practice bank. Participants are codes only: never type a name or phone number here.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-lg">
              <Stat label="Enrolled" value={real.filter((p) => !p.withdrawn_at).length} sub="target 10" />
              <Stat label="Calls done" value={finished} sub={`of ${realCalls.length}`} />
              <Stat label="Withdrawn" value={real.filter((p) => p.withdrawn_at).length} />
            </div>
          </section>

          <section className="rounded-[24px] bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-[18px] font-bold">
              <ShieldCheck className="size-5 text-calm" /> Guardrails, every call
            </h2>
            <ul className="mt-2 space-y-1 text-[14px] text-ink-soft">
              <li>Consented, pre-registered participants only.</li>
              <li>Saying &ldquo;RUKO&rdquo; ends the call at once.</li>
              <li>Fictional agency and people only (BNS §204). No real OTP, card, Aadhaar or PIN is ever asked for.</li>
              <li>Money only moves on the practice bank. Always debrief.</li>
              <li>Stop if the person seems distressed.</li>
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-[24px] bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-[20px] font-bold">
            <UserPlus className="size-5 text-calm" /> Enrol a participant
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select label="Age band" value={form.age_band} onChange={(v) => setForm({ ...form, age_band: v })} options={AGE_BANDS.map((b) => [b, b])} />
            <Select
              label="Gender (optional)"
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v })}
              options={[["na", "Prefer not to say"], ["f", "Woman"], ["m", "Man"], ["x", "Other"]]}
            />
            <Select label="Call language" value={form.language} onChange={(v) => setForm({ ...form, language: v })} options={[["en", "English"], ["hi", "Hindi"]]} />
            <Select
              label="Phone"
              value={form.phone_type}
              onChange={(v) => setForm({ ...form, phone_type: v })}
              options={[["smartphone", "Smartphone"], ["feature", "Feature phone"], ["none", "None"]]}
            />
            <div className="flex flex-col gap-2 pt-1 text-[15px]">
              <Toggle label="Uses UPI" on={form.uses_upi} set={(v) => setForm({ ...form, uses_upi: v })} />
              <Toggle label="Lives alone" on={form.lives_alone} set={(v) => setForm({ ...form, lives_alone: v })} />
              <Toggle label="Family usually present" on={form.family_present_default} set={(v) => setForm({ ...form, family_present_default: v })} />
              <Toggle label="Had heard of “digital arrest”" on={form.prior_awareness} set={(v) => setForm({ ...form, prior_awareness: v })} />
            </div>
            <Select
              label="“Could you spot and stop a fake police call?” (1–5)"
              value={String(form.self_efficacy_pre)}
              onChange={(v) => setForm({ ...form, self_efficacy_pre: Number(v) })}
              options={[1, 2, 3, 4, 5].map((n) => [String(n), String(n)])}
            />
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-2xl bg-paper p-4 text-[15px]">
            <input
              type="checkbox"
              className="mt-1 size-5 accent-[#0b4a45]"
              checked={form.consent_signed}
              onChange={(e) => setForm({ ...form, consent_signed: e.target.checked })}
            />
            <span>
              <b>The signed consent form is on file.</b> They know they&apos;ll get practice scam calls at a surprise time during the session, that
              no real money or details are involved, that saying &ldquo;RUKO&rdquo; stops a call, and that they can withdraw and have their data
              deleted at any time.
            </span>
          </label>
          <label className="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-4 text-[15px]">
            <input
              type="checkbox"
              className="size-5 accent-[#0b4a45]"
              checked={form.teachback_passed}
              onChange={(e) => setForm({ ...form, teachback_passed: e.target.checked })}
            />
            <span>
              <b>Teach-back passed:</b> they explained in their own words that calls may be fake, no real money moves, and RUKO stops a call.
            </span>
            <span className="flex items-center gap-2">
              Attempts
              <select
                value={form.teachback_attempts}
                onChange={(e) => setForm({ ...form, teachback_attempts: Number(e.target.value) })}
                className="rounded-lg border border-ink/12 bg-white px-2 py-1"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </span>
          </label>
          <p className="mt-2 text-[14px] text-ink-soft">Their allocation row (call order and arms) is revealed only after you enrol them.</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={enrol}
              disabled={busy || !form.consent_signed || !form.teachback_passed}
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-calm px-5 text-[16px] font-bold text-white disabled:bg-calm/30"
            >
              <UserPlus className="size-5" /> {busy ? "Enrolling…" : "Enrol and plan calls"}
            </button>
            {error && <p className="text-[15px] text-alarm">{error}</p>}
          </div>
        </section>

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[20px] font-bold">{showSeeded ? "Illustrative participants (seeded, not real)" : "Participants"}</h2>
            <div className="flex flex-wrap items-center gap-2 text-[14px]">
              <div className="flex rounded-full bg-white p-1 shadow-soft">
                <button onClick={() => setShowSeeded(false)} className={`rounded-full px-3 py-1.5 font-bold ${!showSeeded ? "bg-ink text-white" : "text-ink-soft"}`}>
                  Real
                </button>
                <button onClick={() => setShowSeeded(true)} className={`rounded-full px-3 py-1.5 font-bold ${showSeeded ? "bg-gold text-white" : "text-ink-soft"}`}>
                  Illustrative
                </button>
              </div>
              {showSeeded && (
                <>
                  <button onClick={() => seed(true)} className="rounded-full bg-white px-3 py-1.5 font-bold shadow-soft">
                    Re-seed D01–D10
                  </button>
                  <button onClick={() => seed(false)} className="rounded-full bg-white px-3 py-1.5 font-bold text-alarm shadow-soft">
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="mt-3 rounded-[24px] bg-white p-6 text-[16px] text-ink-soft shadow-soft">
              {showSeeded ? "No illustrative data. Press Re-seed to create D01–D10." : "No one enrolled yet. Enrol the first participant above."}
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {shown.map((p) => {
                const pc = calls.filter((c) => c.participant_id === p.id).sort((a, b) => a.order_no - b.order_no);
                return (
                  <article key={p.id} className={`rounded-[24px] bg-white p-4 shadow-soft ${p.withdrawn_at ? "opacity-60" : ""}`}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="text-[22px] font-bold tabular">{p.code}</span>
                      {p.row_no && (
                        <span className="rounded-full bg-paper px-2 py-0.5 text-[13px] font-bold">
                          Row {p.row_no} · {p.arm_order === "AB" ? "without Ruko first" : "with Ruko first"}
                        </span>
                      )}
                      <span className="text-[14px] text-ink-soft">
                        {p.age_band} · {p.language === "hi" ? "Hindi" : "English"} · {p.phone_type ?? "—"}
                        {p.uses_upi ? " · UPI" : ""}
                        {p.family_present_default ? " · family present" : ""}
                      </span>
                      {p.withdrawn_at && <span className="rounded-full bg-alarm-soft px-2 py-0.5 text-[13px] font-bold text-alarm">Withdrawn</span>}
                      {!p.seeded && (
                        <div className="ml-auto flex flex-wrap gap-2 text-[14px]">
                          <button onClick={() => copyLink(p)} className="flex min-h-9 items-center gap-1.5 rounded-full border border-ink/12 px-3 font-bold">
                            {copied === p.id ? <Check className="size-4 text-calm" /> : <Phone className="size-4" />}
                            {copied === p.id ? "Copied" : "Phone link"}
                          </button>
                          <button onClick={() => act(p, "withdraw")} className="flex min-h-9 items-center gap-1.5 rounded-full border border-ink/12 px-3 font-bold">
                            <UserMinus className="size-4" /> {p.withdrawn_at ? "Re-include" : "Withdraw"}
                          </button>
                          <button onClick={() => act(p, "delete")} className="flex min-h-9 items-center gap-1.5 rounded-full border border-alarm/30 px-3 font-bold text-alarm">
                            <Trash2 className="size-4" /> Erase
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {pc.map((c) => (
                        <CallChip key={c.id} call={c} title={titles[c.script_id] ?? c.script_id} disabled={Boolean(p.withdrawn_at) || p.seeded} />
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[24px] bg-white p-5 text-[15px] shadow-soft">
          <h2 className="flex items-center gap-2 text-[18px] font-bold">
            <FlaskConical className="size-5 text-calm" /> How a session runs
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
            <li>
              After consent and the teach-back, enrol the person. Press <b>Phone link</b> and open it on their phone: it becomes a practice phone (bank, Ruko, Messages).
            </li>
            <li>
              Open a call. On the laptop, open the <b>caller screen</b> in a second window facing them (or route its sound into a real call).
            </li>
            <li>Read each line with the console; tick how far they got. Payments, Ruko checks and family alerts are logged automatically.</li>
            <li>End the call, ask whether it felt real, debrief, record distress. Block 2 comes at least 48 hours after block 1.</li>
          </ol>
          <p className="mt-3 flex items-center gap-2 text-ink-soft">
            <ClipboardCopy className="size-4" /> Scale: {SCALE.map((s) => `${s.level} ${s.short}`).join(" · ")}
          </p>
        </section>
      </div>
    </div>
  );
}

function CallChip({ call, title, disabled }: { call: TrialCall; title: string; disabled: boolean }) {
  const arm = armLabel(call);
  const step = call.furthest_step;
  const inner = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-ink-soft tabular">Call {call.order_no}</span>
        <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${arm.cls}`}>{arm.label}</span>
      </span>
      <span className="mt-1 block truncate text-[15px] font-bold">{title}</span>
      <span className="mt-1 flex items-center gap-2 text-[13px] text-ink-soft">
        {call.status === "ended" && !call.is_scam ? (
          <>
            <span className={`size-2.5 rounded-full ${call.control_outcome === "C3" ? "bg-alarm" : "bg-calm"}`} />
            {call.control_outcome ? `${call.control_outcome} ${CONTROL_LABEL[call.control_outcome]}` : "Ended · code the outcome"}
          </>
        ) : call.status === "ended" ? (
          <>
            <span className={`size-2.5 rounded-full ${step !== null && step >= 6 ? "bg-alarm" : "bg-calm"}`} />
            Reached {step}: {SCALE[step ?? 0].short}
          </>
        ) : call.status === "live" ? (
          <span className="font-bold text-alarm">● Live now</span>
        ) : call.status === "aborted" ? (
          "Aborted"
        ) : (
          <>
            <Play className="size-3.5" /> Ready
          </>
        )}
      </span>
    </>
  );
  const cls = "block rounded-2xl border border-ink/10 p-3 transition";
  return disabled ? (
    <div className={`${cls} bg-paper/60`}>{inner}</div>
  ) : (
    <Link href={`/lab/run/${call.id}`} className={`${cls} hover:border-calm hover:bg-calm-soft/40`}>
      {inner}
    </Link>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-soft">
      <p className="text-[13px] font-bold text-ink-soft">{label}</p>
      <p className="text-[28px] leading-none font-bold tabular">{value}</p>
      {sub && <p className="text-[12px] text-ink-soft">{sub}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return (
    <label className="block">
      <span className="text-[14px] font-bold text-ink-soft">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-ink/12 bg-paper px-3 text-[16px]">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="size-4 accent-[#0b4a45]" />
      {label}
    </label>
  );
}
