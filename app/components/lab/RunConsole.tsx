"use client";

import { AlertTriangle, ArrowLeft, Bell, Check, ExternalLink, Landmark, MessageSquareWarning, Octagon, Play, RotateCcw, ShieldAlert, Volume2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DrillScript, DrillStep } from "@/lib/drill";
import type { Activity } from "@/lib/lab";
import {
  CONTROL_LABEL,
  looksIdentifying,
  SCALE,
  STOPPED_BY_LABEL,
  type ControlOutcome,
  type Participant,
  type StoppedBy,
  type TrialCall,
} from "@/lib/trial";
import { armLabel } from "./LabHome";

// The facilitator's console for one call (method: docs/research/06 §5.4):
// read the script line by line (the caller screen speaks it), tick how far the
// person got, and watch what the practice phone logs as it happens.
// Keys: Space = next line · H = hesitation line · E = end call.

const CAP_SECONDS = 12 * 60;
const FACES = ["😌", "🙂", "😐", "😟", "😣"];

export function RunConsole({ callId, script, nextCallId }: { callId: string; script: DrillScript; nextCallId: string | null }) {
  const [call, setCall] = useState<TrialCall | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [washout, setWashout] = useState<number | null>(null);
  const [codes, setCodes] = useState<{ case4: string; track6: string } | null>(null);
  const [spoken, setSpoken] = useState<string[]>([]);
  const [setup, setSetup] = useState({ lang: "en" as "en" | "hi", channel: "browser" as "browser" | "phone", familyPresent: false, stressPre: 0, inRoom: true, auto: true });
  const [now, setNow] = useState(0);
  const [post, setPost] = useState({ stress: 0, stressAfter: 0, confidence: 0, belief: "" as "" | "yes" | "unsure" | "no", control: "" as "" | ControlOutcome, debriefed: false, deviation: "", notes: "" });
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/lab/calls/${callId}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setCall(d.call);
    setParticipant(d.participant);
    setActivity(d.activity);
    setWashout(d.washoutHours);
    setCodes(d.codes);
    setNow(Date.now());
  }, [callId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 1500);
    return () => clearInterval(id);
  }, [load]);

  // Setup defaults come from the plan and the participant once loaded.
  const ready = call?.status === "ready";
  useEffect(() => {
    if (participant && call && ready) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSetup((s) => ({ ...s, lang: participant.language === "hi" ? "hi" : "en", familyPresent: participant.family_present_default, channel: call.channel }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant?.id, call?.id, ready]);

  const act = useCallback(
    async (body: Record<string, unknown>) => {
      const r = await fetch(`/api/lab/calls/${callId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) {
        const d = await r.json();
        if (d?.id) setCall(d);
      }
      load();
    },
    [callId, load],
  );

  const lang = call?.lang ?? setup.lang;
  const debrief = script.steps.find((s) => s.id === "debrief");
  const steps = useMemo(() => script.steps.filter((s) => s.id !== "debrief" && !(s.id === "drill_disclosure" && call?.family_present)), [script, call?.family_present]);
  const nextStep = steps.find((s) => !spoken.includes(s.id));
  const lastSpoken = [...steps].reverse().find((s) => spoken.includes(s.id));
  const text = useCallback((s: DrillStep) => (lang === "hi" ? s.line_hi : s.line_en), [lang]);

  const sayStep = useCallback(
    (s: DrillStep, kind: "line" | "pressure" = "line") => {
      const t = kind === "pressure" && s.branches?.hesitate ? (lang === "hi" ? s.branches.hesitate.hi : s.branches.hesitate.en) : text(s);
      setSpoken((x) => (x.includes(s.id) ? x : [...x, s.id]));
      act({ action: "say", stepId: s.id, stage: s.stage, kind: s.id === "drill_disclosure" ? "disclosure" : kind, text: t });
    },
    [act, lang, text],
  );

  const endCall = useCallback((by?: StoppedBy) => act({ action: "end", by, text: debrief ? text(debrief) : undefined }), [act, debrief, text]);

  useEffect(() => {
    if (call?.status !== "live") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.code === "Space" && nextStep) {
        e.preventDefault();
        sayStep(nextStep);
      } else if (e.key.toLowerCase() === "h" && lastSpoken?.branches?.hesitate) sayStep(lastSpoken, "pressure");
      else if (e.key.toLowerCase() === "e") endCall();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call?.status, nextStep, lastSpoken, sayStep, endCall]);

  if (!call || !participant) return <p className="p-10 text-ink-soft">Loading…</p>;

  const arm = armLabel(call);
  const secs = call.started_at ? Math.max(0, Math.round(((call.ended_at ? Date.parse(call.ended_at) : now) - Date.parse(call.started_at)) / 1000)) : 0;
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const live = call.status === "live";
  const done = call.status === "ended" || call.status === "aborted";
  const phoneCode = /courier|parcel/i.test(call.script_id) ? codes?.track6 : codes?.case4;
  const identifying = looksIdentifying(post.notes) || looksIdentifying(post.deviation);

  const savePost = async () => {
    await act({
      action: "post",
      stress: post.stress || null,
      stress_after: post.stressAfter || null,
      confidence: post.confidence || null,
      belief_real: call.is_scam ? post.belief || null : null,
      ...(call.is_scam || call.control_outcome === "C3" ? {} : { control_outcome: post.control || null }),
      debriefed: post.debriefed,
      deviation: post.deviation.trim() || null,
      notes: post.notes.trim() || null,
    });
    setSaved(true);
  };

  const correct = (level: number) => {
    const why = prompt(`Correct the level from ${call.furthest_step} to ${level}. Why? (kept in the audit log)`);
    if (why && why.trim()) act({ action: "step", level, correct: true, why: why.trim() });
  };

  return (
    <div className="min-h-[100dvh] bg-paper-2 text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/8 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <Link href="/lab" className="flex items-center gap-1 text-[15px] font-bold text-calm">
            <ArrowLeft className="size-4" /> Lab
          </Link>
          <span className="text-[22px] font-bold tabular">{participant.code}</span>
          <span className="text-[15px] text-ink-soft">
            Row {participant.row_no ?? "—"} ({participant.arm_order ?? "—"}) · block {call.block ?? "—"} · call {call.order_no} of 4
          </span>
          <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${arm.cls}`}>{arm.label}</span>
          <span className="truncate text-[16px] font-bold">{script.title_en}</span>
          <span className={`ml-auto rounded-full px-3 py-1 text-[15px] font-bold tabular ${live ? (secs >= CAP_SECONDS ? "bg-warn text-white" : "bg-alarm text-white") : "bg-white"}`}>
            {live ? `● ${mmss}` : done ? `Ended · ${mmss}` : "Not started"}
          </span>
        </div>
        {live && secs >= CAP_SECONDS && (
          <p className="bg-warn px-5 py-1.5 text-center text-[14px] font-bold text-white">12-minute cap reached: wind the call down and end it.</p>
        )}
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl bg-white p-4 text-[15px] shadow-soft">
            <b>{arm.label}.</b>{" "}
            {call.arm === "baseline"
              ? "Ruko is OFF on their practice phone (it shows “paused”). The bank has no hold. Don't mention Ruko."
              : "Ruko is ON: “Is this a scam?”, family alert and the bank hold all work. Don't prompt them to use it."}{" "}
            {!call.is_scam && "This is a genuine (control) call: a Ruko alarm here is a false alarm."}
          </p>

          {ready && (
            <section className="rounded-[24px] bg-white p-5 shadow-soft">
              <h2 className="text-[20px] font-bold">Before you start</h2>
              {washout !== null && washout < 48 && (
                <p className="mt-2 flex gap-2 rounded-xl bg-warn-soft p-3 text-[15px] font-bold text-warn">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Only {Math.round(washout)} h since block 1. The method needs at least 48 h between blocks.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-4 text-[15px]">
                <Seg label="Language" value={setup.lang} options={[["en", "English"], ["hi", "Hindi"]]} set={(v) => setSetup({ ...setup, lang: v as "en" | "hi" })} />
                <Seg
                  label="Channel (plan: block-2 scam is the real call)"
                  value={setup.channel}
                  options={[["browser", "Caller screen"], ["phone", "Real phone call"]]}
                  set={(v) => setSetup({ ...setup, channel: v as "browser" | "phone" })}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-5 text-[15px]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={setup.familyPresent} onChange={(e) => setSetup({ ...setup, familyPresent: e.target.checked })} className="size-4" />
                  Family member present (skips the opening disclosure)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={setup.auto} onChange={(e) => setSetup({ ...setup, auto: e.target.checked })} className="size-4" />
                  Bot plays the caller (it listens and replies; Space and H still work)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={setup.inRoom} onChange={(e) => setSetup({ ...setup, inRoom: e.target.checked })} className="size-4" />
                  Facilitator in the room
                </label>
              </div>
              <Faces label="How are they feeling right now? (ask before the call)" value={setup.stressPre} set={(v) => setSetup({ ...setup, stressPre: v })} />
              <ol className="mt-4 list-decimal space-y-1 pl-5 text-[15px] text-ink-soft">
                <li>Their phone shows the practice home screen (Lab → Phone link). Go back to its home screen now.</li>
                <li>
                  Open the{" "}
                  <a href={`/lab/caller/${call.id}`} target="ruko-caller" className="inline-flex items-center gap-1 font-bold text-calm underline">
                    caller screen <ExternalLink className="size-3.5" />
                  </a>{" "}
                  in a second window and press <b>Ready</b>. For a real call, route its sound into the phone line.
                </li>
                <li>Start when they are settled. The caller screen rings; they choose whether to answer.</li>
              </ol>
              <button
                onClick={() => act({ action: "start", lang: setup.lang, channel: setup.channel, familyPresent: setup.familyPresent, stressPre: setup.stressPre || null, facilitatorInRoom: setup.inRoom, auto: setup.auto })}
                className="mt-4 flex min-h-12 items-center gap-2 rounded-2xl bg-alarm px-5 text-[17px] font-bold text-white"
              >
                <Play className="size-5" /> Start call (it rings)
              </button>
            </section>
          )}

          {(live || done) && (
            <section className="rounded-[24px] bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h2 className="text-[18px] font-bold">Script ({lang === "hi" ? "Hindi" : "English"})</h2>
                <p className="text-[13px] text-ink-soft">
                  {live && (call.live.answered ? "Answered · " : "Ringing… · ")}Space = next line · H = hesitation line · E = end
                </p>
              </div>
              {call.is_scam && phoneCode && (
                <p className="mt-2 rounded-xl bg-calm-soft px-3 py-2 text-[14px]">
                  Their phone shows the DRILL code <b className="tabular">{phoneCode}</b>. If they read it out, tick level 3 (Disclosed).
                </p>
              )}
              {call.live.auto && <BotPanel call={call} live={live} onAccept={(level) => act({ action: "step", level })} />}
              <ol className="mt-2 flex flex-col gap-1.5">
                {steps.map((s) => {
                  const said = spoken.includes(s.id);
                  const isNext = nextStep?.id === s.id;
                  return (
                    <li key={s.id} className={`rounded-2xl border p-3 ${isNext && live ? "border-calm bg-calm-soft/50" : said ? "border-transparent bg-paper/60 text-ink-soft" : "border-ink/8"}`}>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 w-24 shrink-0 text-[12px] font-bold tracking-wide text-ink-soft uppercase">{s.stage.replace("_", " ")}</span>
                        <p className="flex-1 text-[16px] leading-snug">{text(s)}</p>
                        {live && (
                          <div className="flex shrink-0 gap-1">
                            <button onClick={() => sayStep(s)} title="Say this line" className={`flex size-9 items-center justify-center rounded-full ${isNext ? "bg-calm text-white" : "bg-paper"}`}>
                              {said ? <Check className="size-4" /> : <Volume2 className="size-4" />}
                            </button>
                            {s.branches?.hesitate && (
                              <button
                                onClick={() => sayStep(s, "pressure")}
                                title={lang === "hi" ? s.branches.hesitate.hi : s.branches.hesitate.en}
                                className="flex h-9 items-center rounded-full bg-gold-soft px-3 text-[12px] font-bold text-warn"
                              >
                                If they hesitate
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
              {call.live.text && live && (
                <p className="mt-3 rounded-xl bg-ink px-3 py-2 text-[14px] text-white">
                  <b>Caller is saying:</b> {call.live.text}
                </p>
              )}
            </section>
          )}

          {done && (
            <section className="rounded-[24px] bg-white p-4 shadow-soft">
              <h2 className="text-[16px] font-bold">Survey bot</h2>
              <p className="mt-1 text-[14px] text-ink-soft">After the debrief, let Ruko ask a few quick questions. Answers are linked to {participant.code}, never a name.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`/survey/participant?call=${call.id}`} target="ruko-survey" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-calm px-4 text-[15px] font-bold text-white">
                  Ask {participant.code} <ExternalLink className="size-4" />
                </a>
                <a href={`/survey/family?call=${call.id}`} target="ruko-survey" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-paper px-4 text-[15px] font-bold">
                  Ask their family member <ExternalLink className="size-4" />
                </a>
              </div>
            </section>
          )}

          {done && call.events.length > 0 && (
            <section className="rounded-[24px] bg-white p-4 text-[14px] shadow-soft">
              <h2 className="text-[16px] font-bold">Event log</h2>
              <p className="mt-1 text-ink-soft">
                {call.events.map((e) => `${Math.floor(e.t / 60)}:${String(e.t % 60).padStart(2, "0")} ${e.kind}${e.detail ? ` (${e.detail})` : ""}`).join(" · ")}
              </p>
              {call.level_edit_log.length > 0 && (
                <p className="mt-2 text-warn">Corrections: {call.level_edit_log.map((l) => `${l.from}→${l.to}: ${l.why}`).join("; ")}</p>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          {(live || done) && call.is_scam && (
            <section className="rounded-[24px] bg-white p-4 shadow-soft">
              <h2 className="text-[18px] font-bold">Furthest step reached</h2>
              <p className="text-[13px] text-ink-soft">
                Tick 0–3 as they happen; 4–7 fill in from the phone. If unsure, tick the level worse for Ruko. Shift-click to correct (asks why).
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {SCALE.map((s) => {
                  const reached = (call.furthest_step ?? -1) >= s.level;
                  const t = call.step_times[String(s.level)];
                  return (
                    <button
                      key={s.level}
                      onClick={(e) => (e.shiftKey ? correct(s.level) : act({ action: "step", level: s.level }))}
                      title={s.long}
                      className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-left text-[15px] ${
                        reached ? (s.level >= 6 ? "bg-alarm text-white" : "bg-calm text-white") : "bg-paper hover:bg-calm-soft"
                      }`}
                    >
                      <span className="w-4 font-bold tabular">{s.level}</span>
                      <span className="flex-1 font-bold">{s.short}</span>
                      {s.auto && <span className="text-[11px] opacity-70">auto</span>}
                      {t !== undefined && (
                        <span className="text-[12px] tabular opacity-80">
                          {Math.floor(t / 60)}:{String(t % 60).padStart(2, "0")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[13px] text-ink-soft">Primary outcome: stopped before pay = level 5 or lower.</p>
            </section>
          )}

          {(live || done) && (
            <section className="rounded-[24px] bg-white p-4 shadow-soft">
              <h2 className="text-[18px] font-bold">From their phone (automatic)</h2>
              <ul className="mt-2 flex flex-col gap-2 text-[15px]">
                <Signal
                  icon={ShieldAlert}
                  on={Boolean(activity?.rukoChecks.length)}
                  alarm={!call.is_scam && Boolean(activity?.rukoChecks.some((c) => c.level !== "clear"))}
                  label={activity?.rukoChecks.length ? `Ruko check: ${activity.rukoChecks.map((c) => c.level.toUpperCase()).join(", ")}` : "No Ruko check"}
                />
                <Signal icon={Bell} on={Boolean(activity?.familyAlerted)} label={activity?.familyAlerted ? "Family alerted" : "Family not alerted"} />
                <Signal icon={MessageSquareWarning} on={Boolean(activity?.tellFamily)} label={activity?.tellFamily ? "They tapped “Tell my family”" : "No “Tell my family”"} />
                <Signal
                  icon={Landmark}
                  on={Boolean(activity?.transfers.length)}
                  alarm={activity?.transfers.some((t) => t.status === "completed" || t.status === "released")}
                  label={
                    activity?.transfers.length
                      ? activity.transfers.map((t) => `₹${t.amount.toLocaleString("en-IN")} → ${t.payee}: ${t.status}`).join("; ")
                      : "No payment"
                  }
                />
              </ul>
            </section>
          )}

          {live && (
            <section className="rounded-[24px] bg-white p-4 shadow-soft">
              <h2 className="text-[18px] font-bold">{call.is_scam ? "They stopped. What stopped them?" : "Genuine call"}</h2>
              {call.is_scam && (
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {(Object.keys(STOPPED_BY_LABEL) as StoppedBy[])
                    .filter((k) => k !== "stop_word")
                    .map((k) => (
                      <button key={k} onClick={() => act({ action: "stopped", by: k })} className={`min-h-10 rounded-xl px-2 text-[14px] font-bold ${call.stopped_by === k ? "bg-calm text-white" : "bg-paper"}`}>
                        {STOPPED_BY_LABEL[k]}
                      </button>
                    ))}
                </div>
              )}
              <p className="mt-3 text-[13px] font-bold text-ink-soft">Distress (protocol §2.4)</p>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {["Mild", "Moderate", "Severe"].map((l, i) => (
                  <button
                    key={l}
                    onClick={() => {
                      act({ action: "distress", level: i + 1 });
                      if (i === 2) endCall("facilitator");
                    }}
                    className={`min-h-10 rounded-xl text-[14px] font-bold ${(call.adverse_event_level ?? 0) > i ? "bg-warn text-white" : "bg-warn-soft text-warn"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => endCall()} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-ink text-[16px] font-bold text-white">
                  End call + debrief
                </button>
                <button
                  onClick={() => endCall("facilitator")}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-alarm text-[16px] font-bold text-white"
                  title="Distress, confusion, real money or real details, or they asked to stop"
                >
                  <Octagon className="size-5" /> RUKO: stop now
                </button>
              </div>
            </section>
          )}

          {done && (
            <section className="rounded-[24px] bg-white p-4 shadow-soft">
              <h2 className="text-[18px] font-bold">After the call</h2>
              <p className="mt-1 text-[14px] text-ink-soft">
                {call.is_scam ? (
                  <>
                    Reached <b>{call.furthest_step ?? "—"}</b> ({SCALE[call.furthest_step ?? 0].short}) ·{" "}
                    {(call.furthest_step ?? 0) <= 5 ? "stopped before pay" : "pressed Pay"}
                    {call.money_moved ? " · money moved" : ""}
                    {call.stopped_by ? ` · ${STOPPED_BY_LABEL[call.stopped_by].toLowerCase()}` : ""}
                    {call.time_to_stop_s !== null ? ` · ${call.time_to_stop_s}s` : ""}
                  </>
                ) : call.control_outcome === "C3" ? (
                  <b className="text-alarm">C3: a Ruko alarm fired on a genuine call (system false alarm).</b>
                ) : (
                  "Genuine call: code the outcome below."
                )}
              </p>
              {call.is_scam && (
                <div className="mt-3">
                  <p className="text-[14px] font-bold">Ask first, before the debrief chat: “While it was going on, did you think it was real?”</p>
                  <div className="mt-1 flex gap-1.5">
                    {(["yes", "unsure", "no"] as const).map((b) => (
                      <button key={b} onClick={() => setPost({ ...post, belief: b })} className={`min-h-10 flex-1 rounded-xl text-[14px] font-bold ${post.belief === b ? "bg-calm text-white" : "bg-paper"}`}>
                        {b === "yes" ? "Yes" : b === "unsure" ? "Not sure" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!call.is_scam && call.control_outcome !== "C3" && (
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {(["C0", "C1", "C2"] as const).map((c) => (
                    <button key={c} onClick={() => setPost({ ...post, control: c })} className={`min-h-10 rounded-xl px-3 text-left text-[14px] font-bold ${post.control === c ? "bg-calm text-white" : "bg-paper"}`}>
                      {c} · {CONTROL_LABEL[c]}
                    </button>
                  ))}
                </div>
              )}
              <Faces label="Distress straight after the call" value={post.stress} set={(v) => setPost({ ...post, stress: v })} />
              <Rating label="How sure were they of what they did? (1–5)" value={post.confidence} set={(v) => setPost({ ...post, confidence: v })} />
              {debrief && (
                <div className="mt-3 rounded-2xl bg-calm-soft p-3 text-[15px]">
                  <p className="font-bold">Debrief (warmly, in your own words):</p>
                  <p className="mt-1">{text(debrief)}</p>
                  <p className="mt-1 text-ink-soft">They did nothing wrong; these gangs are trained professionals. Ask how they feel. Offer a break.</p>
                </div>
              )}
              <Faces label="Distress after the debrief" value={post.stressAfter} set={(v) => setPost({ ...post, stressAfter: v })} />
              {(post.stress >= 4 || post.stressAfter >= 4 || (setup.stressPre && post.stress - setup.stressPre >= 2)) && (
                <p className="mt-2 rounded-xl bg-warn-soft p-2 text-[14px] font-bold text-warn">Distress trigger: follow the distress protocol (§2.4) before any further call.</p>
              )}
              <label className="mt-3 flex items-center gap-2 text-[15px] font-bold">
                <input type="checkbox" checked={post.debriefed} onChange={(e) => setPost({ ...post, debriefed: e.target.checked })} className="size-4" />
                Debrief done
              </label>
              <input
                value={post.deviation}
                onChange={(e) => setPost({ ...post, deviation: e.target.value })}
                placeholder="Deviation from the script or plan (if any)"
                className="mt-3 w-full rounded-xl border border-ink/12 bg-paper p-3 text-[15px]"
              />
              <textarea
                value={post.notes}
                onChange={(e) => setPost({ ...post, notes: e.target.value })}
                rows={3}
                placeholder="Notes (no names or phone numbers)"
                className="mt-2 w-full rounded-xl border border-ink/12 bg-paper p-3 text-[15px]"
              />
              {identifying && <p className="mt-1 text-[13px] font-bold text-alarm">This looks like it may contain a number or contact. Remove it before saving.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={savePost} disabled={identifying} className="flex min-h-11 items-center gap-2 rounded-2xl bg-calm px-4 text-[15px] font-bold text-white disabled:bg-calm/30">
                  {saved ? <Check className="size-4" /> : null} {saved ? "Saved" : "Save"}
                </button>
                {nextCallId && (
                  <Link href={`/lab/run/${nextCallId}`} className="flex min-h-11 items-center rounded-2xl bg-ink px-4 text-[15px] font-bold text-white">
                    Next call →
                  </Link>
                )}
                <button
                  onClick={() => confirm("Reset this call so it can be run again? Its outcome will be cleared.") && act({ action: "reset" })}
                  className="flex min-h-11 items-center gap-1.5 rounded-2xl border border-ink/12 px-3 text-[14px] font-bold"
                >
                  <RotateCcw className="size-4" /> Re-run
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Signal({ icon: I, on, label, alarm }: { icon: typeof Bell; on: boolean; label: string; alarm?: boolean }) {
  return (
    <li className={`flex items-start gap-2 rounded-xl px-3 py-2 ${alarm ? "bg-alarm-soft text-alarm" : on ? "bg-calm-soft" : "bg-paper text-ink-soft"}`}>
      <I className="mt-0.5 size-4 shrink-0" />
      <span className={on ? "font-bold" : ""}>{label}</span>
    </li>
  );
}

function Seg({ label, value, options, set }: { label: string; value: string; options: string[][]; set: (v: string) => void }) {
  return (
    <div>
      <p className="text-[13px] font-bold text-ink-soft">{label}</p>
      <div className="mt-1 flex rounded-xl bg-paper p-1">
        {options.map(([v, l]) => (
          <button key={v} onClick={() => set(v)} className={`rounded-lg px-3 py-1.5 font-bold ${value === v ? "bg-ink text-white" : "text-ink-soft"}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

const INTENT_WORDS: Record<string, string> = {
  comply: "went along",
  hesitate: "hesitated",
  refuse: "refused",
  ask_proof: "asked for proof",
  mention_family: "mentioned their family",
  will_pay: "said they would pay",
  agree_secret: "agreed to keep it secret",
  code_read: "read out a code",
  silence: "said nothing",
  question: "asked a question",
  other: "said something else",
  stop_word: "said RUKO",
};

/** What the scammer bot is doing: how the person replied (the kind only, never their words) and levels it suggests. */
function BotPanel({ call, live, onAccept }: { call: TrialCall; live: boolean; onAccept: (level: number) => void }) {
  const heard = call.events.filter((e) => e.kind.startsWith("heard:"));
  const last = [...heard].reverse().find((e) => e.detail?.startsWith("suggest_"));
  const suggested = last?.detail ? Number(last.detail.replace("suggest_", "")) : null;
  const reached = call.furthest_step ?? -1;
  return (
    <div className="mt-2 rounded-xl bg-calm-soft px-3 py-2 text-[14px]">
      <p className="font-bold">The bot is playing the caller{live ? "" : " (this call)"}.</p>
      {heard.length === 0 ? (
        <p className="text-ink-soft">Waiting for them to answer and speak. Their words are not stored, only how they replied.</p>
      ) : (
        <p className="mt-1 text-ink-soft">
          {heard
            .slice(-6)
            .map((e) => INTENT_WORDS[e.kind.slice(6)] ?? e.kind.slice(6))
            .join(" → ")}
        </p>
      )}
      {live && suggested !== null && suggested > reached && call.is_scam && (
        <button onClick={() => onAccept(suggested)} className="mt-2 rounded-full bg-calm px-3 py-1.5 text-[13px] font-bold text-white">
          Bot suggests level {suggested} ({SCALE.find((s) => s.level === suggested)?.short ?? ""}): tick it
        </button>
      )}
    </div>
  );
}

function Faces({ label, value, set }: { label: string; value: number; set: (v: number) => void }) {
  return (
    <div className="mt-3">
      <p className="text-[14px] font-bold">{label}</p>
      <div className="mt-1 flex gap-1.5">
        {FACES.map((f, i) => (
          <button key={i} onClick={() => set(i + 1)} title={`${i + 1}`} className={`size-11 rounded-xl text-[22px] ${value === i + 1 ? "bg-calm ring-2 ring-calm" : "bg-paper"}`}>
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}

function Rating({ label, value, set }: { label: string; value: number; set: (v: number) => void }) {
  return (
    <div className="mt-3">
      <p className="text-[14px] font-bold">{label}</p>
      <div className="mt-1 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => set(n)} className={`size-10 rounded-xl text-[16px] font-bold ${value === n ? "bg-calm text-white" : "bg-paper"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
