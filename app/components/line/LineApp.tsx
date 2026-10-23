"use client";

import { ArrowRight, PhoneForwarded, ShieldCheck } from "lucide-react";
import { Chip, TechBackdrop } from "@/components/tech/TechBackdrop";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACTION_TEXT, DECISION_TEXT, GRADE_TEXT, type Decision, type Grade } from "@/lib/line";
import { LINE_SCENARIOS, type LineScenario } from "@/lib/line-demo";

// Ruko Line, the demo. A call comes in; Ruko grades the number, a calm assistant screens the caller, and the call is
// put through, taken as a message, or blocked, with the family told. The decision is made on the server from what the
// caller said. This is the decision engine only: answering real calls needs a phone line (see the note at the bottom).

type Lang = "en" | "hing";
type Line = { who: "ruko" | "caller"; text: string };
interface Result {
  grade: Grade;
  baseGrade: Grade;
  transcript: Line[];
  decision: Decision | null;
  familyAlerted: boolean;
  locked: boolean;
}

const DOT: Record<Grade, string> = { green: "#2f7d4f", yellow: "#b7791f", orange: "#c2570c", red: "#d6291f" };

function GradeChip({ grade, lang, big }: { grade: Grade; lang: Lang; big?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold ${big ? "text-[22px]" : "text-[17px]"}`}>
      <span className="inline-block size-3.5 rounded-full" style={{ background: DOT[grade] }} />
      {GRADE_TEXT[grade][lang]}
    </span>
  );
}

export function LineApp({ elderId, owner }: { elderId: string; owner: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const [scenario, setScenario] = useState<LineScenario | null>(null);
  const [custom, setCustom] = useState({ number: "", contact: false });
  const [live, setLive] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [today, setToday] = useState<Array<{ who: string; grade: Grade; action: string }>>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logged = useRef(false);

  const screen = useCallback(
    async (number: string, contact: boolean, said: string[]) => {
      setBusy(true);
      try {
        const r = await fetch("/api/line/screen", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ elderId, number, contact, lang, lines: said }),
        });
        if (r.ok) setRes((await r.json()) as Result);
      } finally {
        setBusy(false);
      }
    },
    [elderId, lang],
  );

  const start = (s: LineScenario | null, number: string, contact: boolean, liveCall: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    logged.current = false;
    setScenario(s);
    setLive(liveCall);
    setLines([]);
    setRes(null);
    setTyped("");
    void screen(number, contact, []);
  };

  const number = scenario?.number ?? custom.number;
  const contact = scenario?.contact ?? custom.contact;

  // A scripted call plays itself: after Ruko speaks, the caller answers a moment later.
  useEffect(() => {
    if (!scenario || live || !res || res.decision || busy) return;
    const script = scenario.lines[lang];
    if (lines.length >= script.length) return;
    timer.current = setTimeout(() => {
      const next = [...lines, script[lines.length]];
      setLines(next);
      void screen(number, contact, next);
    }, 1700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [scenario, live, res, busy, lines, lang, number, contact, screen]);

  useEffect(() => {
    if (res?.decision && !logged.current) {
      logged.current = true;
      const action = ACTION_TEXT[res.decision.action][lang];
      setToday((t) => [{ who: number, grade: res.grade, action }, ...t].slice(0, 6));
    }
  }, [res, number, lang]);

  const sendTyped = () => {
    if (!typed.trim() || res?.decision) return;
    const next = [...lines, typed.trim()];
    setLines(next);
    setTyped("");
    void screen(number, contact, next);
  };

  const inCall = Boolean(res) && (scenario !== null || live);
  const d = res?.decision ?? null;
  const en = lang === "en";

  const step = !res ? 0 : d ? 3 : res.transcript.length > 0 ? 2 : 1;
  const reset = () => {
    if (timer.current) clearTimeout(timer.current);
    setScenario(null);
    setLive(false);
    setRes(null);
    setLines([]);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#060a10] text-white">
      <TechBackdrop glow="green" />
      <main className="relative mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip tone="green">
              <span className="size-2 rounded-full bg-[#4ade80] motion-safe:animate-pulse" /> Call screening
            </Chip>
            <Chip tone="grey">Code decides</Chip>
          </div>
          <button onClick={() => setLang(en ? "hing" : "en")} className="min-h-11 rounded-full border border-white/20 px-4 text-[15px] font-semibold text-white/85 hover:border-[#38e1ff]">
            {en ? "English" : "Hinglish"}
          </button>
        </div>
        <h1 className="mt-5 text-[40px] leading-[1.04] font-bold tracking-tight sm:text-[64px]">
          Ruko Line<span className="text-[#38e1ff]">.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[19px] leading-relaxed text-white/70">
          {en
            ? `When an unknown number calls ${owner}, Ruko checks it first, asks who it is, and only puts genuine calls through.`
            : `Jab koi anjaan number ${owner} ko call karta hai, Ruko pehle jaanchta hai, poochta hai kaun hai, aur sirf asli calls aage deta hai.`}
        </p>

        {/* the three steps, lit as the call moves through them */}
        <ol className="mt-8 grid gap-2 sm:grid-cols-3" aria-label="How a call is handled">
          {[
            [en ? "Grade the number" : "Number ki jaanch", en ? "Contacts, reports, series, international" : "Contacts, reports, series"],
            [en ? "Screen the caller" : "Caller se poochhna", en ? "A calm assistant asks who and why" : "Shaant assistant poochhta hai kaun aur kyun"],
            [en ? "Decide" : "Faisla", en ? "Put through, take a message, or block" : "Jodna, message lena, ya block"],
          ].map(([t, sub], i) => (
            <li key={t} className={`rounded-[16px] border p-4 transition-colors duration-300 ${step > i ? "border-[#38e1ff]/60 bg-[#38e1ff]/[0.08]" : "border-white/10 bg-white/[0.03]"}`}>
              <p className="font-mono text-[12px] text-[#38e1ff]">0{i + 1}</p>
              <p className="text-[18px] font-semibold">{t}</p>
              <p className="text-[14px] text-white/55">{sub}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* left: pick a call */}
          <section aria-label={en ? "Try an incoming call" : "Ek incoming call try kijiye"}>
            <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">{en ? "Try an incoming call" : "Ek incoming call try kijiye"}</p>
            <div className="mt-3 grid gap-2">
              {LINE_SCENARIOS.map((s) => {
                const on = scenario?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => start(s, s.number, s.contact, false)}
                    className={`m-tap group flex min-h-[72px] items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left transition ${on ? "border-[#38e1ff] bg-[#38e1ff]/10" : "border-white/10 bg-white/[0.035] hover:border-[#38e1ff]/50"}`}
                  >
                    <span>
                      <span className="block text-[18px] leading-snug font-semibold">{s.title[lang]}</span>
                      <span className="block font-mono text-[14px] text-white/50">{s.number}</span>
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[#38e1ff]" />
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.035] p-5">
              <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">{en ? "Or play the caller yourself" : "Ya caller ban kar khud khelein"}</p>
              <input
                value={custom.number}
                onChange={(e) => setCustom({ ...custom, number: e.target.value })}
                inputMode="tel"
                aria-label={en ? "Caller's number" : "Caller ka number"}
                placeholder="+91 98xxx xxxxx"
                className="mt-3 min-h-[56px] w-full rounded-[14px] border border-white/20 bg-[#0a1118] px-4 font-mono text-[19px] text-white placeholder:text-white/30 focus:border-[#38e1ff] focus:outline-none"
              />
              <label className="mt-3 flex min-h-11 items-center gap-3 text-[17px] text-white/85">
                <input type="checkbox" checked={custom.contact} onChange={(e) => setCustom({ ...custom, contact: e.target.checked })} className="size-6 accent-[#38e1ff]" />
                {en ? "This number is in the contacts" : "Yeh number contacts mein hai"}
              </label>
              <button
                disabled={custom.number.trim().length < 3}
                onClick={() => start(null, custom.number, custom.contact, true)}
                className="press m-tap mt-3 min-h-[60px] w-full rounded-[16px] bg-[#38e1ff] text-[20px] font-semibold text-[#041016] disabled:opacity-30"
              >
                {en ? "Ring" : "Ring karein"}
              </button>
            </div>
          </section>

          {/* right: the call being screened */}
          <section aria-label={en ? "Screening" : "Screening"} className="rounded-[24px] border border-white/10 bg-[#0a1118] p-5 sm:p-6">
            {!inCall || !res ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
                <span className="relative grid size-20 place-items-center" aria-hidden>
                  <span className="m-ring absolute inset-0 rounded-full border border-[#38e1ff]/40" />
                  <ShieldCheck className="relative size-9 text-[#38e1ff]" />
                </span>
                <p className="mt-5 text-[20px] font-semibold">{en ? "Waiting for a call" : "Call ka intezaar"}</p>
                <p className="mt-1 max-w-xs text-[16px] text-white/55">{en ? "Pick a call on the left. Ruko grades it, screens it and decides, live." : "Baayein ek call chuniye."}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[12px] tracking-[0.14em] text-white/50 uppercase">{en ? "Incoming call" : "Incoming call"}</p>
                    <p className="mt-1 font-mono text-[28px] leading-tight font-bold">{number}</p>
                  </div>
                  <GradeChip grade={res.grade} lang={lang} big />
                </div>
                <p className="mt-2 text-[16px] text-white/65">
                  {GRADE_TEXT[res.grade].why[lang]}
                  {res.grade !== res.baseGrade && (
                    <span className="text-white/45">
                      {" "}
                      ({en ? "was" : "pehle"} {GRADE_TEXT[res.baseGrade][lang]})
                    </span>
                  )}
                </p>

                <ul className="mt-5 flex flex-col gap-3" aria-live="polite">
                  {res.transcript.map((m, i) => (
                    <li key={i} className={`m-word max-w-[88%] rounded-[16px] px-4 py-3 text-[17px] leading-snug ${m.who === "ruko" ? "self-start border border-[#38e1ff]/30 bg-[#38e1ff]/[0.07]" : "self-end border border-white/15 bg-white/[0.05]"}`}>
                      <span className={`mb-1 block font-mono text-[11px] font-semibold tracking-[0.12em] uppercase ${m.who === "ruko" ? "text-[#38e1ff]" : "text-white/50"}`}>{m.who === "ruko" ? "Ruko assistant" : "Caller"}</span>
                      {m.text}
                    </li>
                  ))}
                  {busy && !d && (
                    <li className="relative self-start overflow-hidden rounded-[16px] border border-white/10 px-4 py-3 font-mono text-[14px] text-white/50">
                      <span className="m-shimmer absolute inset-0" aria-hidden />
                      {en ? "Screening…" : "Jaanch…"}
                    </li>
                  )}
                </ul>

                {live && !d && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendTyped()}
                      aria-label={en ? "What the caller says" : "Caller kya kehta hai"}
                      placeholder={en ? "What the caller says…" : "Caller kya kehta hai…"}
                      className="min-h-[56px] min-w-0 flex-1 rounded-[14px] border border-white/20 bg-[#060a10] px-4 text-[18px] text-white placeholder:text-white/30 focus:border-[#38e1ff] focus:outline-none"
                    />
                    <button onClick={sendTyped} className="min-h-[56px] rounded-[14px] bg-[#38e1ff] px-5 text-[18px] font-semibold text-[#041016]">
                      {en ? "Say" : "Bolo"}
                    </button>
                  </div>
                )}

                {d && (
                  <div className={`m-stop-in mt-6 rounded-[18px] border-2 p-5 ${d.action === "block" ? "border-[#ff4d3d] bg-[#ff4d3d]/10" : d.action === "patch" ? "border-[#4ade80] bg-[#4ade80]/10" : "border-[#fbbf24] bg-[#fbbf24]/10"}`}>
                    <p className="font-mono text-[12px] tracking-[0.14em] text-white/60 uppercase">{en ? "Decision" : "Faisla"}</p>
                    <p className={`mt-1 text-[36px] leading-tight font-bold ${d.action === "block" ? "text-[#ff8a7d]" : d.action === "patch" ? "text-[#4ade80]" : "text-[#fbbf24]"}`}>{ACTION_TEXT[d.action][lang]}</p>
                    <p className="mt-1 text-[16px] text-white/70">{ACTION_TEXT[d.action].tone}</p>
                    <ul className="mt-3 flex flex-col gap-1 text-[16px] text-white/85">
                      {d.why.map((c) => (
                        <li key={c} className="flex gap-2">
                          <span className="text-[#38e1ff]" aria-hidden>
                            ›
                          </span>
                          {DECISION_TEXT[c]?.[lang] ?? c}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {d.action === "block" && <Chip tone="red">{en ? "Number blocked" : "Number block"}</Chip>}
                      {d.action === "block" && <Chip tone="cyan">{res.familyAlerted ? (en ? "Family told" : "Parivar ko bataya") : en ? "Saved for the family" : "Family screen par"}</Chip>}
                      {d.action === "block" && res.locked && <Chip tone="cyan">Money Lock on</Chip>}
                      {d.action === "patch" && (
                        <Chip tone="green">
                          <PhoneForwarded className="size-3.5" /> {owner}&rsquo;s phone rings now
                        </Chip>
                      )}
                    </div>
                    <button onClick={reset} className="press m-tap mt-5 min-h-[60px] w-full rounded-[16px] bg-white text-[19px] font-semibold text-[#060a10]">
                      {en ? "Next call" : "Agli call"}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {today.length > 0 && (
          <section className="mt-8 rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
            <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">{en ? "This session" : "Is session mein"}</p>
            <ul className="mt-2">
              {today.map((t, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-3 text-[16px] last:border-0">
                  <span className="font-mono text-white/80">{t.who}</span>
                  <span className="flex items-center gap-3">
                    <GradeChip grade={t.grade} lang={lang} />
                    <span className="text-white/55">{t.action}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 max-w-3xl text-[14px] leading-snug text-white/45">
          {en
            ? "Demo of the decision engine. Answering real calls needs a phone line from a phone service or a native Android app; nothing here records audio or listens to a real call."
            : "Yeh decision engine ka demo hai. Asli calls uthane ke liye phone service ki line ya native Android app chahiye; yahan koi audio record nahi hota."}
        </p>
      </main>
    </div>
  );
}
