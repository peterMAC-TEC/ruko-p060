"use client";

import { ArrowRight, PhoneForwarded, PhoneOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
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

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-6 pb-10 text-ink">
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-[16px] text-ink-soft underline underline-offset-4">
          Home
        </Link>
        <button onClick={() => setLang(en ? "hing" : "en")} className="min-h-[44px] rounded-full border border-hair px-4 text-[15px] font-semibold">
          {en ? "English" : "Hinglish"}
        </button>
      </div>

      <h1 className="display mt-6 text-[44px] leading-[1.05]">Ruko Line</h1>
      <p className="mt-3 text-[19px] text-ink-soft">
        {en
          ? `When an unknown number calls ${owner}, Ruko checks it first, asks who it is, and only puts genuine calls through.`
          : `Jab koi anjaan number ${owner} ko call karta hai, Ruko pehle jaanchta hai, poochta hai kaun hai, aur sirf asli calls aage deta hai.`}
      </p>

      {!inCall && (
        <>
          <p className="mt-8 text-[15px] font-semibold tracking-[0.14em] text-ink-soft uppercase">{en ? "Try an incoming call" : "Ek incoming call try kijiye"}</p>
          <div className="mt-2 flex flex-col">
            {LINE_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => start(s, s.number, s.contact, false)}
                className="flex min-h-[72px] items-center justify-between gap-3 border-b border-hair py-3 text-left"
              >
                <span>
                  <span className="block text-[20px] font-semibold">{s.title[lang]}</span>
                  <span className="block text-[15px] text-ink-soft">{s.number}</span>
                </span>
                <ArrowRight className="size-5 shrink-0" />
              </button>
            ))}
          </div>

          <p className="mt-8 text-[15px] font-semibold tracking-[0.14em] text-ink-soft uppercase">{en ? "Or play the caller yourself" : "Ya caller ban kar khud khelein"}</p>
          <input
            value={custom.number}
            onChange={(e) => setCustom({ ...custom, number: e.target.value })}
            inputMode="tel"
            placeholder="+91 98xxx xxxxx"
            className="mt-2 min-h-[56px] rounded-[14px] border border-hair px-4 text-[20px]"
          />
          <label className="mt-3 flex items-center gap-3 text-[18px]">
            <input type="checkbox" checked={custom.contact} onChange={(e) => setCustom({ ...custom, contact: e.target.checked })} className="size-6" />
            {en ? "This number is in the contacts" : "Yeh number contacts mein hai"}
          </label>
          <button
            disabled={custom.number.trim().length < 3}
            onClick={() => start(null, custom.number, custom.contact, true)}
            className="mt-4 min-h-[64px] rounded-[18px] bg-ink text-[21px] font-semibold text-white disabled:opacity-40"
          >
            {en ? "Ring" : "Ring karein"}
          </button>
        </>
      )}

      {inCall && res && (
        <section className="mt-8">
          <div className="border-t border-hair pt-4">
            <p className="text-[15px] text-ink-soft">Incoming call</p>
            <p className="display text-[34px] leading-tight">{number}</p>
            <div className="mt-2 flex items-center gap-3">
              <GradeChip grade={res.grade} lang={lang} big />
              {res.grade !== res.baseGrade && (
                <span className="text-[15px] text-ink-soft">
                  ({en ? "was" : "pehle"} {GRADE_TEXT[res.baseGrade][lang]})
                </span>
              )}
            </div>
            <p className="mt-1 text-[16px] text-ink-soft">{GRADE_TEXT[res.grade].why[lang]}</p>
          </div>

          <ul className="mt-5 flex flex-col gap-3" aria-live="polite">
            {res.transcript.map((m, i) => (
              <li key={i} className={`max-w-[88%] rounded-[16px] px-4 py-3 text-[18px] leading-snug ${m.who === "ruko" ? "self-start bg-paper-2" : "self-end border border-hair"}`}>
                <span className="mb-1 block text-[13px] font-semibold tracking-wide text-ink-soft uppercase">{m.who === "ruko" ? "Ruko" : "Caller"}</span>
                {m.text}
              </li>
            ))}
            {busy && !d && <li className="self-start text-[16px] text-ink-soft">…</li>}
          </ul>

          {live && !d && (
            <div className="mt-4 flex gap-2">
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTyped()}
                placeholder={en ? "What the caller says…" : "Caller kya kehta hai…"}
                className="min-h-[56px] min-w-0 flex-1 rounded-[14px] border border-hair px-4 text-[19px]"
              />
              <button onClick={sendTyped} className="min-h-[56px] rounded-[14px] bg-ink px-5 text-[18px] font-semibold text-white">
                {en ? "Say" : "Bolo"}
              </button>
            </div>
          )}

          {d && (
            <div className={`mt-6 border-t-[6px] pt-4 ${d.action === "block" ? "border-alarm" : "border-ink"}`}>
              <p className={`display text-[52px] leading-[1] ${d.action === "block" ? "text-alarm" : ""}`}>{ACTION_TEXT[d.action][lang]}</p>
              <p className="mt-2 text-[18px] text-ink-soft">{ACTION_TEXT[d.action].tone}</p>
              <ul className="mt-4 flex flex-col gap-1 text-[18px]">
                {d.why.map((c) => (
                  <li key={c}>· {DECISION_TEXT[c]?.[lang] ?? c}</li>
                ))}
              </ul>
              {d.action === "block" && (
                <ul className="mt-4 flex flex-col gap-2 text-[18px] font-semibold">
                  <li className="flex items-center gap-2">
                    <PhoneOff className="size-5" /> {en ? "Number blocked" : "Number block ho gaya"}
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="size-5" /> {res.familyAlerted ? (en ? "Family told" : "Parivar ko bata diya") : en ? "Saved to the family screen" : "Family screen par save"}
                  </li>
                  {res.locked && (
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="size-5" /> {en ? "Money Lock on" : "Money Lock chalu"}
                    </li>
                  )}
                </ul>
              )}
              {d.action === "patch" && (
                <p className="mt-4 flex items-center gap-2 text-[18px] font-semibold">
                  <PhoneForwarded className="size-5" /> {owner}&rsquo;s phone rings now
                </p>
              )}
              <button
                onClick={() => {
                  if (timer.current) clearTimeout(timer.current);
                  setScenario(null);
                  setLive(false);
                  setRes(null);
                  setLines([]);
                }}
                className="mt-6 min-h-[64px] w-full rounded-[18px] bg-ink text-[21px] font-semibold text-white"
              >
                {en ? "Next call" : "Agli call"}
              </button>
            </div>
          )}
        </section>
      )}

      {today.length > 0 && (
        <section className="mt-10">
          <p className="text-[15px] font-semibold tracking-[0.14em] text-ink-soft uppercase">{en ? "This session" : "Is session mein"}</p>
          <ul className="mt-2">
            {today.map((t, i) => (
              <li key={i} className="flex items-center justify-between border-b border-hair py-3 text-[17px]">
                <span>{t.who}</span>
                <span className="flex items-center gap-3">
                  <GradeChip grade={t.grade} lang={lang} />
                  <span className="text-ink-soft">{t.action}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-[14px] leading-snug text-ink-soft">
        {en
          ? "Demo of the decision engine. Answering real calls needs a phone line from a phone service or a native Android app; nothing here records audio or listens to a real call."
          : "Yeh decision engine ka demo hai. Asli calls uthane ke liye phone service ki line ya native Android app chahiye; yahan koi audio record nahi hota."}
      </p>
    </main>
  );
}
