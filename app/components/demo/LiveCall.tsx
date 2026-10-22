"use client";

import { Mic, Phone, PhoneOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Guardian } from "@/components/brand/Guardian";
import { CompanionApp } from "@/components/companion/CompanionApp";
import { VoiceTrust } from "@/components/demo/VoiceTrust";
import { demoOffline } from "@/lib/demo-mode";
import { officerNext, officerOpen, officerStart, rukoShouldStep, tacticsUsed, type Lang, type OfficerState } from "@/lib/demo-officer";
import { classify } from "@/lib/bots/intent";
import { BUNDLED_LIBRARY } from "@/lib/patterns";
import { runRadar } from "@/lib/radar";
import { SCALE, stoppedBeforePay } from "@/lib/trial";
import { hush, ring } from "@/lib/voice";

// The live demo call. YOU are the older person; a fictional officer phones you and runs the seven stages of a "digital
// arrest" call, by voice, and you really can resist him (he has a counter for each objection, and always gets to the
// money within about 90 seconds). When he asks for money, Ruko's own scam check says STOP, and you choose how it ends.
//
// It is a SIMULATION inside this page: nothing rings a real phone, nothing is recorded, nothing you say is stored
// (it lives in memory and is gone when the call ends), and the bank is a practice bank. Only signal codes are kept.

type Phase = "consent" | "incoming" | "call" | "stop" | "endA" | "endB" | "result";
type Ending = "A" | "B";
type Tx = { id: string; status: string; amount: number } | null;

const DEMO_NUMBER = "+91 99999 00417";
const STOP_WORD = /\bru+k+h?o+\b|रुको|रूको/i;
const CODE_WORD = "mango";

// ---- speech out ---------------------------------------------------------------------------------------------------
function chooseVoice(role: "officer" | "ruko"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const en = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const natural = en.filter((v) => /natural|online/i.test(v.name));
  const indian = (a: SpeechSynthesisVoice[]) => a.filter((v) => /en[-_]IN/i.test(v.lang));
  const pool = indian(natural).length ? indian(natural) : natural.length ? natural : indian(en).length ? indian(en) : en;
  const male = pool.filter((v) => /prabhat|ravi|hemant|male|david|mark|james|guy|george|ryan|daniel/i.test(v.name) && !/female/i.test(v.name));
  const female = pool.filter((v) => /neerja|heera|swara|female|zira|aria|jenny|sonia|libby|samantha|veena|kalpana/i.test(v.name));
  return role === "officer" ? (male[0] ?? pool[0]) : (female[0] ?? pool[1] ?? pool[0]);
}

// ---- speech in ----------------------------------------------------------------------------------------------------
type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
function getRecognition(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

export function LiveCall({ elderId, demo, trusted }: { elderId: string; demo: boolean; trusted?: { name: string; phone: string } }) {
  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>("consent");
  const [officerLine, setOfficerLine] = useState("");
  const [you, setYou] = useState("");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<"speaking" | "listening" | "thinking" | "">("");
  const [seconds, setSeconds] = useState(0);
  const [micOk, setMicOk] = useState(true);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [familyAlerted, setFamilyAlerted] = useState<boolean | null>(null);
  const [tactics, setTactics] = useState<string[]>([]);
  const [agreedSecret, setAgreedSecret] = useState(false);
  const [tx, setTx] = useState<Tx>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [companion, setCompanion] = useState(false);
  const [endedBy, setEndedBy] = useState<"stop_word" | "payment" | null>(null);

  const run = useRef(0);
  const stopRing = useRef<(() => void) | null>(null);
  const rec = useRef<Rec | null>(null);
  const heard = useRef({ text: "", final: false, at: 0 });
  const typedResolver = useRef<((t: string) => void) | null>(null);
  const callStart = useRef(0);
  const bankOpenedAt = useRef(0);
  const speaking = useRef("");
  const offline = useRef(false);

  // ---- helpers ----
  const stopEverything = useCallback(() => {
    run.current++;
    stopRing.current?.();
    stopRing.current = null;
    hush();
    try {
      rec.current?.abort();
    } catch {
      // Not running.
    }
    rec.current = null;
    typedResolver.current = null;
  }, []);
  useEffect(() => stopEverything, [stopEverything]);

  // Clock on the call screen.
  useEffect(() => {
    if (phase !== "call") return;
    const t = setInterval(() => setSeconds(Math.round((Date.now() - callStart.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  const startRecognition = useCallback(() => {
    const R = getRecognition();
    if (!R) {
      setMicOk(false);
      return;
    }
    const r = new R();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const list = Array.from(e.results);
      const text = list.map((x) => x[0]?.transcript ?? "").join(" ").trim();
      heard.current = { text, final: Boolean(list[list.length - 1]?.isFinal), at: Date.now() };
      setYou(text);
    };
    r.onend = () => {
      // Chrome ends continuous recognition now and then: start it again for as long as the call runs.
      if (rec.current === r) {
        try {
          r.start();
        } catch {
          // Already starting.
        }
      }
    };
    r.onerror = () => setMicOk(false);
    rec.current = r;
    try {
      r.start();
    } catch {
      setMicOk(false);
    }
  }, []);

  /** The officer speaks. Resolves "done", "stop" (the stop word was heard) or "barged" (the person started talking over him). */
  const say = useCallback((text: string, role: "officer" | "ruko", id: number): Promise<"done" | "stop" | "barged"> => {
    return new Promise((resolve) => {
      speaking.current = text;
      hush();
      heard.current = { text: "", final: false, at: 0 };
      setYou("");
      setStatus("speaking");
      let finished = false;
      const finish = (r: "done" | "stop" | "barged") => {
        if (finished) return;
        finished = true;
        clearInterval(poll);
        clearTimeout(guard);
        speaking.current = "";
        resolve(r);
      };
      const guard = setTimeout(() => {
        hush();
        finish("done");
      }, Math.min(30_000, 2500 + text.split(/\s+/).length * 600));
      const poll = setInterval(() => {
        if (id !== run.current) return finish("done");
        const h = heard.current.text;
        if (STOP_WORD.test(h)) {
          hush();
          return finish("stop");
        }
        // Talking over him: at least two words that are not just his own voice coming back through the speakers.
        if (role === "officer" && h) {
          const mine = new Set(words(text));
          const w = words(h);
          const own = w.filter((x) => mine.has(x)).length / Math.max(1, w.length);
          if (w.length >= 2 && own < 0.4) {
            hush();
            return finish("barged");
          }
        }
      }, 80);
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setTimeout(() => finish("done"), Math.min(12_000, 1500 + text.split(/\s+/).length * 380));
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN";
      const v = chooseVoice(role);
      if (v) u.voice = v;
      u.pitch = role === "officer" ? 0.75 : 1;
      u.rate = role === "officer" ? 1.04 : 0.92;
      u.onend = () => finish("done");
      u.onerror = () => finish("done");
      window.speechSynthesis.speak(u);
    });
  }, []);

  /** The person's reply: by voice, or typed. "" means silence; the stop word comes back as the stop word. */
  const listen = useCallback((id: number, carry: boolean): Promise<string> => {
    return new Promise((resolve) => {
      if (!carry) heard.current = { text: "", final: false, at: 0 };
      setStatus("listening");
      const t0 = Date.now();
      let done = false;
      const finish = (t: string) => {
        if (done) return;
        done = true;
        clearInterval(poll);
        typedResolver.current = null;
        resolve(t);
      };
      typedResolver.current = (t) => finish(t);
      const poll = setInterval(() => {
        if (id !== run.current) return finish("");
        const h = heard.current;
        if (STOP_WORD.test(h.text)) return finish(h.text);
        // Done talking: a final result, or the words stopped changing for 1.4 s.
        if (h.text && (h.final || Date.now() - h.at > 1400)) return finish(h.text);
        if (!h.text && Date.now() - t0 > 4000) return finish("");
        if (Date.now() - t0 > 16_000) return finish(h.text);
      }, 100);
    });
  }, []);

  // ---- the call ----
  const endCall = useCallback(
    (by: "stop_word" | "payment", state: OfficerState) => {
      hush();
      setStatus("");
      setTactics(tacticsUsed(state));
      setEndedBy(by);
      if (by === "stop_word") {
        setEnding("A");
        setPhase("endA");
      } else setPhase("stop");
    },
    [],
  );

  const ruko = useCallback(
    async (id: number, state: OfficerState) => {
      // The payment ask has landed: Ruko's own scam check decides, in code, using the same engine as the real app.
      const answers = { stay_on_call: "yes", pay_avoid_arrest: "yes", keep_secret: "yes" } as const;
      const t0 = Date.now();
      const local = runRadar(BUNDLED_LIBRARY, { identity: "police", answers });
      endCall("payment", state);
      void say(
        lang === "en"
          ? "Stop. This is a scam call. Do not send any money. Hang up now. Then call one nine three zero, or tell your family."
          : "Ruko. Yeh scam call hai. Koi paise mat bhejiye. Abhi call kaat dijiye. Phir ek nau teen zero par phone kijiye, ya apne parivar ko bataiye.",
        "ruko",
        run.current,
      );
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ elderId, identity: "police", answers, msToWarning: Date.now() - t0 }),
        });
        const d = await res.json();
        setFamilyAlerted(Boolean(d.familyAlerted));
      } catch {
        setFamilyAlerted(false);
      }
      return local.level;
    },
    [elderId, endCall, lang, say],
  );

  const runCall = useCallback(async () => {
    const id = ++run.current;
    offline.current = demoOffline();
    let state = officerStart();
    callStart.current = Date.now();
    setSeconds(0);
    setLatencies([]);
    setAgreedSecret(false);
    startRecognition();
    let turn = officerOpen(state, lang);
    state = turn.state;
    setOfficerLine(turn.text);
    let carry = false;
    let outcome = await say(turn.text, "officer", id);
    for (let guard = 0; guard < 30 && id === run.current; guard++) {
      if (outcome === "stop") return endCall("stop_word", state);
      if (rukoShouldStep(state)) {
        await ruko(id, state);
        return;
      }
      carry = outcome === "barged";
      const reply = await listen(id, carry);
      if (id !== run.current) return;
      const tReply = Date.now();
      setStatus("thinking");
      const intent = classify(reply);
      if (intent === "agree_secret") setAgreedSecret(true);
      turn = officerNext(state, reply, Date.now() - callStart.current, lang);
      state = turn.state;
      if (turn.kind === "end") return endCall("stop_word", state);
      setOfficerLine(turn.text);
      setLatencies((l) => [...l.slice(-7), Date.now() - tReply]);
      outcome = await say(turn.text, "officer", id);
    }
  }, [endCall, lang, listen, ruko, say, startRecognition]);

  // ---- screens ----
  const consent = () => {
    // The demo family circle gets a code word (only in the demo sandbox), so the approval step has something to check.
    if (demo) {
      fetch("/api/circle/codeword", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ elderId, codeWord: CODE_WORD }) }).catch(() => {});
    }
    setPhase("incoming");
    if (typeof window !== "undefined") window.speechSynthesis?.getVoices();
    stopRing.current = ring();
  };
  const answer = () => {
    stopRing.current?.();
    stopRing.current = null;
    setPhase("call");
    void runCall();
  };
  const decline = () => {
    stopEverything();
    setPhase("consent");
  };
  const endDemo = () => {
    stopEverything();
    // A fresh start: clear the held payment, the alerts and the lock from the last run (demo sandbox only).
    if (demo) fetch("/api/demo/reset", { method: "POST" }).catch(() => {});
    setPhase("consent");
    setEnding(null);
    setTx(null);
    setFamilyAlerted(null);
  };
  const submitTyped = () => {
    const t = typed.trim();
    if (!t) return;
    setTyped("");
    setYou(t);
    typedResolver.current?.(t);
  };
  const bigStop = () => {
    // The same as saying the stop word.
    hush();
    stopRing.current?.();
    typedResolver.current?.("RUKO");
    heard.current = { text: "RUKO", final: true, at: Date.now() };
  };

  // Poll the practice bank while the bank is open, so this screen can say plainly what happened to the payment.
  useEffect(() => {
    if (phase !== "endB") return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/transfers?elderId=${elderId}`, { cache: "no-store" });
        if (!r.ok || stop) return;
        const rows = (await r.json()) as Array<{ id: string; status: string; amount: number; payee: string; created_at: string }>;
        // Only the payment made in this bank screen counts, not the practice account's older ones.
        const mine = rows.find((x) => x.payee === "Government Verification Account" && new Date(x.created_at).getTime() >= bankOpenedAt.current - 2000);
        setTx(mine ? { id: mine.id, status: mine.status, amount: mine.amount } : null);
      } catch {
        // Keep the last answer.
      }
    };
    void load();
    const t = setInterval(load, 1500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [phase, elderId]);

  const en = lang === "en";
  const live = phase === "call";

  // ---- result numbers ----
  const furthest = ending === "B" ? (tx ? 6 : 4) : endedBy === "stop_word" ? 0 : agreedSecret ? 2 : 1;
  const stopped = stoppedBeforePay(furthest);
  const moved = tx ? ["completed", "released"].includes(tx.status) : false;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-4 pb-8 text-ink">
      <div className="flex items-center justify-between gap-2">
        <Link href="/demo" onClick={stopEverything} className="min-h-12 content-center text-[16px] text-ink-soft underline underline-offset-4">
          All scenes
        </Link>
        {phase !== "consent" && (
          <button onClick={endDemo} className="min-h-12 rounded-full border border-hair px-4 text-[16px] font-semibold">
            End demo
          </button>
        )}
      </div>

      {phase === "consent" && (
        <section className="flex flex-1 flex-col">
          <h1 className="display mt-6 text-[48px] leading-[1.02]">Live call</h1>
          <p className="mt-4 rounded-[18px] border border-ink p-5 text-[21px] leading-snug">
            {en
              ? "This is a role-played scam call for a demo. Nothing is recorded. Say RUKO at any time to stop. Demo only: do not say real details."
              : "Yeh demo ke liye role-play scam call hai. Kuch record nahi hota. Rokne ke liye kabhi bhi RUKO boliye. Sirf demo: asli jaankari mat boliye."}
          </p>
          <div className="mt-4 flex gap-2">
            {(["en", "hing"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`min-h-12 rounded-full px-5 text-[17px] font-semibold ${lang === l ? "bg-ink text-white" : "border border-hair"}`}>
                {l === "en" ? "English" : "Hinglish"}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[17px] text-ink-soft">
            {en ? "You play the older person: answer him by voice, or type if your mic does not work. Use Chrome or Edge, with the volume up." : "Aap buzurg ka role karenge: awaaz se jawab dijiye, ya mic na chale to likhiye. Chrome ya Edge mein, awaaz badhakar."}
          </p>
          <button onClick={consent} className="press mt-auto min-h-[72px] rounded-[18px] bg-ink text-[22px] font-semibold text-white">
            {en ? "I understand" : "Main samajh gaya"}
          </button>
        </section>
      )}

      {phase === "incoming" && (
        <section className="flex flex-1 flex-col items-center text-center">
          <Guardian mood="safe" className="mt-10 size-16" />
          <p className="mt-8 text-[18px] text-ink-soft">{en ? "Incoming call" : "Incoming call"}</p>
          <p className="display mt-1 text-[44px] leading-tight">{en ? "Unknown number" : "Anjaan number"}</p>
          <p className="text-[22px] text-ink-soft tabular">{DEMO_NUMBER}</p>
          <p className="mt-2 text-[15px] text-ink-soft">{en ? "A fictional demo number." : "Yeh ek kaalpanik demo number hai."}</p>
          <div className="mt-auto grid w-full grid-cols-2 gap-3 pt-10">
            <button onClick={decline} className="flex min-h-[72px] items-center justify-center gap-2 rounded-[18px] border border-hair text-[20px] font-semibold">
              <PhoneOff className="size-6" />
              {en ? "Decline" : "Decline"}
            </button>
            <button onClick={answer} className="press flex min-h-[72px] items-center justify-center gap-2 rounded-[18px] bg-ink text-[20px] font-semibold text-white">
              <Phone className="size-6" />
              {en ? "Answer" : "Answer"}
            </button>
          </div>
        </section>
      )}

      {live && (
        <section className="flex flex-1 flex-col">
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[16px] text-ink-soft">{en ? "On the call" : "Call par"}</p>
              <p className="text-[22px] font-semibold tabular">
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} · {DEMO_NUMBER}
              </p>
            </div>
            <Guardian mood="checking" className="size-12" />
          </div>

          <div className="mt-6 rounded-[18px] bg-paper-2 p-5" aria-live="polite">
            <p className="text-[14px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
              {en ? "The caller (actor)" : "Caller (actor)"}
              {status === "speaking" ? (en ? " · speaking" : " · bol raha hai") : ""}
            </p>
            <p className="display mt-2 text-[28px] leading-snug">&ldquo;{officerLine}&rdquo;</p>
          </div>

          <div className="mt-4 min-h-[88px] rounded-[18px] border border-hair p-5">
            <p className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
              <Mic className={`size-4 ${status === "listening" && micOk ? "text-ink" : ""}`} />
              {en ? "You" : "Aap"}
              {status === "listening" ? (en ? " · your turn, speak now" : " · aapki baari, boliye") : ""}
            </p>
            <p className="mt-2 text-[22px] leading-snug">{you || <span className="text-ink-soft">{micOk ? (en ? "Say what you would really say…" : "Jo sach mein kahenge, woh boliye…") : en ? "Type your reply below." : "Neeche jawab likhiye."}</span>}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitTyped();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={en ? "Or type your reply" : "Ya yahan likhiye"}
              aria-label={en ? "Type your reply" : "Jawab likhiye"}
              className="min-h-16 min-w-0 flex-1 rounded-[18px] border border-hair px-4 text-[20px]"
            />
            <button type="submit" disabled={!typed.trim()} className="min-h-16 rounded-[18px] bg-ink px-6 text-[20px] font-semibold text-white disabled:opacity-30">
              {en ? "Send" : "Bhejo"}
            </button>
          </form>
          {!micOk && <p className="mt-2 text-[16px] text-ink-soft">{en ? "The microphone is not available here, so type your replies." : "Yahan mic available nahi hai, isliye jawab likhiye."}</p>}

          <div className="mt-auto pt-8">
            <button onClick={bigStop} className="flex min-h-[80px] w-full items-center justify-center rounded-[18px] bg-alarm text-[28px] font-semibold text-white">
              {en ? "STOP (or say RUKO)" : "STOP (ya RUKO boliye)"}
            </button>
          </div>

          <details className="mt-4 text-[14px] text-ink-soft">
            <summary className="min-h-10 cursor-pointer py-2">{en ? "Debug: latency" : "Debug: latency"}</summary>
            <p>
              Reply to officer speech: {latencies.length ? latencies.map((l) => `${l} ms`).join(", ") : "no turns yet"}. Voice: {typeof window !== "undefined" && "speechSynthesis" in window ? "browser speech" : "none (captions only)"}.
              Mode: {offline.current ? "offline (scripts only)" : "scripts, AI wording off"}.
            </p>
          </details>
        </section>
      )}

      {phase === "stop" && (
        <section className="m-fade fixed inset-0 z-50 overflow-y-auto border-t-[10px] border-alarm bg-white" role="alertdialog" aria-labelledby="live-stop">
          <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-6 pb-8">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold tracking-[0.16em] text-alarm uppercase">{en ? "This is a scam" : "Yeh scam hai"}</p>
              <Guardian mood="danger" className="size-14" />
            </div>
            <h1 id="live-stop" className="display mt-4 text-[140px] leading-[0.86] text-alarm">
              Stop.
            </h1>
            <div className="my-4 h-[3px] bg-alarm" />
            <p className="border-l-4 border-alarm pl-4 text-[26px] leading-snug font-semibold">{en ? "Do not transfer money. Hang up and verify independently." : "Paise transfer mat kijiye. Call kaatiye aur khud alag se pata kijiye."}</p>
            <p className="mt-4 text-[19px] text-ink-soft">
              {familyAlerted === true ? (en ? "✓ Your family has been alerted in Ruko." : "✓ Ruko mein aapke parivar ko soochna bhej di gayi hai.") : familyAlerted === false ? (en ? "Your family could not be reached by Ruko just now. Please call them." : "Ruko abhi parivar tak nahi pahunch paya. Kripya unhe phone kijiye.") : en ? "Telling your family…" : "Parivar ko bata rahe hain…"}
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <button
                onClick={() => {
                  hush();
                  setEnding("A");
                  setPhase("endA");
                }}
                className="press min-h-[76px] rounded-[18px] bg-ink text-[24px] font-semibold text-white"
              >
                {en ? "Hang up and use Ruko" : "Call kaatiye aur Ruko ka istemaal kijiye"}
              </button>
              <button
                onClick={() => {
                  hush();
                  bankOpenedAt.current = Date.now();
                  setEnding("B");
                  setPhase("endB");
                }}
                className="min-h-[64px] rounded-[18px] border border-hair text-[20px] font-semibold"
              >
                {en ? "I still want to pay" : "Main phir bhi paise bhejna chahta hoon"}
              </button>
              <p className="mt-2 flex items-center justify-between gap-3 border-t border-hair pt-3 text-[16px] text-ink-soft">
                <a href="tel:1930" className="flex min-h-12 items-center gap-2 text-ink">
                  <span className="text-[22px] font-semibold tabular">1930</span> helpline
                </a>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="flex min-h-12 items-center underline underline-offset-4">
                  cybercrime.gov.in
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      {phase === "endA" && (
        <section className="m-rise flex flex-1 flex-col">
          <h1 className="display mt-6 text-[44px] leading-[1.05]">{endedBy === "stop_word" ? (en ? "Call ended. You are safe." : "Call khatam. Aap surakshit hain.") : en ? "Call ended. You paused." : "Call khatam. Aap ruk gaye."}</h1>
          <p className="mt-3 rounded-[18px] bg-safe-soft p-4 text-[21px] leading-snug font-semibold text-safe">{en ? "You have paused. That was a good step." : "Aap ruk gaye. Yeh achha kadam tha."}</p>
          <ol className="mt-5 flex flex-col gap-3 text-[21px] leading-snug">
            <li><b>1.</b> {en ? "Do not call that number back." : "Us number par wapas call mat kijiye."}</li>
            <li><b>2.</b> {en ? "Report it: call 1930 or go to cybercrime.gov.in." : "Report kijiye: 1930 par call karein ya cybercrime.gov.in par jayein."}</li>
            <li><b>3.</b> {familyAlerted ? (en ? `Your family has been alerted${trusted ? ` (${trusted.name.split(" ")[0]})` : ""}. They will call you.` : "Aapke parivar ko soochna mil gayi hai. Woh aapko phone karenge.") : en ? "Call someone you trust now." : "Abhi kisi apne ko phone kijiye."}</li>
          </ol>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <button onClick={() => setCompanion(true)} className="min-h-[72px] rounded-[18px] bg-ink text-[22px] font-semibold text-white">
              {en ? "Talk to Ruko" : "Ruko se baat kijiye"}
            </button>
            <button onClick={() => setPhase("result")} className="min-h-[64px] rounded-[18px] border border-hair text-[20px] font-semibold">
              {en ? "See the result" : "Result dekhiye"}
            </button>
          </div>
          {companion && <CompanionApp elderId={elderId} trusted={trusted} autoStart onClose={() => setCompanion(false)} />}
        </section>
      )}

      {phase === "endB" && (
        <section className="m-rise flex flex-1 flex-col">
          <p className="mt-4 rounded-[12px] bg-ink px-4 py-3 text-center text-[17px] font-semibold tracking-[0.1em] text-white uppercase">MOCK BANK · {en ? "practice only · no real money" : "sirf practice · asli paise nahi"}</p>
          <div className="mt-3 overflow-hidden rounded-[18px] border border-hair">
            <iframe title="Practice bank" src="/bank?embed=1&prefill=live" className="h-[560px] w-full" />
          </div>
          <div className="mt-3 rounded-[18px] bg-paper-2 p-4 text-[20px] leading-snug" aria-live="polite">
            {!tx && (en ? "Press Confirm in the bank above and follow it. Money Lock will pause you for a few seconds (shortened for the demo). Practice PIN: 1234." : "Upar bank mein Confirm dabaiye aur aage badhiye. Money Lock kuch second rokega (demo ke liye chhota). Practice PIN: 1234.")}
            {tx && ["held", "pending"].includes(tx.status) && (en ? `Payment paused. ${trusted?.name.split(" ")[0] ?? "Your family"} has been asked to approve it.` : "Payment ruka hua hai. Parivar se manzoori maangi gayi hai.")}
            {tx && ["blocked", "cancelled"].includes(tx.status) && <b>{en ? "Payment blocked. Money did not move." : "Payment block ho gaya. Paise nahi gaye."}</b>}
            {tx && ["released", "completed"].includes(tx.status) && (en ? "The family approved it (practice bank). In a real bank this is where Ruko's code word check would have stopped a scammer's voice." : "Parivar ne manzoor kar diya (practice bank).")}
          </div>
          <button onClick={() => setShowFamily((v) => !v)} className="mt-3 min-h-14 rounded-[18px] border border-hair text-[18px] font-semibold">
            {showFamily ? (en ? "Hide the family phone" : "Family phone chhupaiye") : en ? "Show the family phone here (if their phone is not paired)" : "Family phone yahin dikhaiye"}
          </button>
          {showFamily && (
            <div className="mt-3 overflow-hidden rounded-[18px] border border-hair">
              <iframe title="Family phone" src="/family?embed=1" className="h-[560px] w-full" />
            </div>
          )}
          <p className="mt-3 text-[15px] text-ink-soft">
            {en ? `On the family phone, open ${typeof window !== "undefined" ? window.location.origin : ""}/family?embed=1. The code word to approve is "${CODE_WORD}" (demo only).` : `Family phone par /family?embed=1 kholiye. Manzoori ka code word "${CODE_WORD}" hai (sirf demo).`}
          </p>
          <button disabled={!tx} onClick={() => setPhase("result")} className="mt-4 min-h-[72px] rounded-[18px] bg-ink text-[22px] font-semibold text-white disabled:opacity-30">
            {en ? "See the result" : "Result dekhiye"}
          </button>
        </section>
      )}

      {phase === "result" && (
        <section className="m-rise flex flex-1 flex-col">
          <p className="mt-4 inline-block self-start rounded-full bg-paper-2 px-3 py-1 text-[14px] font-semibold text-ink-soft">{en ? "Demo data. Not a measured result." : "Demo data. Maapa hua result nahi."}</p>
          <h1 className="display mt-3 text-[46px] leading-[1.04]">{ending === "A" ? (en ? "You stopped before paying." : "Aap paise bhejne se pehle ruk gaye.") : tx && ["blocked", "cancelled"].includes(tx.status) ? (en ? "The payment was held and blocked." : "Payment ruka aur block hua.") : en ? "The payment was held." : "Payment ruka hua hai."}</h1>
          <p className="mt-3 text-[21px] leading-snug">
            {ending === "A"
              ? en ? "You hung up when Ruko said STOP. No money was asked to move on the bank screen." : "Ruko ke STOP kehne par aapne call kaat di. Bank screen par koi paisa nahi gaya."
              : en ? "You chose to pay anyway. Money Lock paused the payment and asked a trusted person. In this practice bank, no money moved." : "Aapne phir bhi pay karna chaha. Money Lock ne payment roka aur parivar se poochha. Is practice bank mein paisa nahi gaya."}
          </p>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[19px]">
            <dt className="text-ink-soft">{en ? "Furthest step" : "Sabse door ka kadam"}</dt>
            <dd className="font-semibold">{furthest} of 7 · {SCALE[furthest].short}</dd>
            <dt className="text-ink-soft">{en ? "Stopped before pay" : "Pay se pehle ruke"}</dt>
            <dd className="font-semibold">{stopped ? (en ? "Yes" : "Haan") : en ? "No (pressed Pay)" : "Nahi (Pay dabaya)"}</dd>
            <dt className="text-ink-soft">{en ? "Money moved" : "Paise gaye"}</dt>
            <dd className="font-semibold">{moved ? (en ? "Yes, in the practice bank" : "Haan, practice bank mein") : en ? "No" : "Nahi"}</dd>
            <dt className="text-ink-soft">{en ? "Family alerted" : "Parivar ko bataya"}</dt>
            <dd className="font-semibold">{familyAlerted ? (en ? "Yes" : "Haan") : en ? "No" : "Nahi"}</dd>
          </dl>
          <h2 className="mt-6 text-[17px] font-semibold tracking-[0.1em] text-ink-soft uppercase">{en ? "What the caller did" : "Caller ne kya kiya"}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-[19px]">
            {tactics.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
          <VoiceTrust lang={lang} />
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                setTx(null);
                setCompanion(false);
                setEnding(null);
                setPhase("stop");
              }}
              className="min-h-[72px] rounded-[18px] bg-ink text-[21px] font-semibold text-white"
            >
              {ending === "A" ? (en ? "Replay as the other ending (pay anyway)" : "Doosra ending dekhiye (phir bhi pay)") : en ? "Replay as the other ending (hang up)" : "Doosra ending dekhiye (call kaatiye)"}
            </button>
            <button onClick={endDemo} className="min-h-[64px] rounded-[18px] border border-hair text-[20px] font-semibold">
              {en ? "Run the call again" : "Call phir se chalaiye"}
            </button>
          </div>
          <p className="mt-5 display text-[26px] leading-snug">{en ? "Either way, the money didn't move. Ruko doesn't try to win the argument with a scammer. It protects the moment that matters." : "Dono mein se jo bhi ho, paise nahi gaye. Ruko scammer se behes jeetne ki koshish nahi karta. Woh sahi pal ko bachata hai."}</p>
          <p className="mt-4 flex items-center justify-between gap-3 border-t border-hair pt-3 text-[16px] text-ink-soft">
            <a href="tel:1930" className="min-h-12 content-center text-ink"><b className="text-[22px] tabular">1930</b> helpline</a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="min-h-12 content-center underline underline-offset-4">cybercrime.gov.in</a>
          </p>
        </section>
      )}
    </main>
  );
}
