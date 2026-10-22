"use client";

import { Phone, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Guardian, type Mood } from "@/components/brand/Guardian";
import { plan, readingMs, SCENE_TEXT, type Beat, type DemoLang, type Scene, type Who } from "@/lib/demo-call";
import { hush, ring } from "@/lib/voice";

// "Watch Ruko step in": a scripted role-play with three synthetic voices. The scammer and Kamala are actors; Ruko
// speaks only when its own scam check says STOP (lib/demo-call.ts). Not a real call, nothing is recorded, and
// no real number is dialled. Captions are always on, so it also works with the sound off.

const NAME: Record<Who, { en: string; hing: string }> = {
  scammer: { en: "The caller (actor)", hing: "Caller (actor)" },
  kamala: { en: "Kamala (actor)", hing: "Kamala (actor)" },
  ruko: { en: "Ruko", hing: "Ruko" },
};

// ---- sound -----------------------------------------------------------------------------------------------------
// The voices are recorded (natural Indian voices, made by scripts/make-demo-audio.py) so they sound the same on every
// phone. If a clip is missing the browser's own voice reads the line, and with the sound off the captions carry it.

type Manifest = Record<"en" | "hi", Record<string, number>>;
const folder = (l: DemoLang) => (l === "en" ? "en" : "hi");

function browserSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return void setTimeout(resolve, readingMs(text));
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    const guard = setTimeout(resolve, readingMs(text) + 6000);
    u.onend = u.onerror = () => {
      clearTimeout(guard);
      resolve();
    };
    window.speechSynthesis.speak(u);
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const moodFor = (scene: Scene | "idle" | "ring"): Mood => (scene === "stop" ? "danger" : scene === "after" || scene === "family" ? "after" : scene === "call" ? "checking" : "safe");

export function CallDemo() {
  const [lang, setLang] = useState<DemoLang>("en");
  const [sound, setSound] = useState(true);
  const [phase, setPhase] = useState<"idle" | "ring" | "play" | "done">("idle");
  const [withRuko, setWithRuko] = useState(true);
  const [shown, setShown] = useState<Beat[]>([]);
  const [speaker, setSpeaker] = useState<Who | null>(null);
  const run = useRef(0);
  const players = useRef<HTMLAudioElement[]>([]);
  const manifest = useRef<Manifest | null>(null);
  const stopRing = useRef<(() => void) | null>(null);

  const stopAll = useCallback(() => {
    run.current++;
    stopRing.current?.();
    stopRing.current = null;
    hush();
    for (const p of players.current) {
      p.onended = p.onerror = null;
      p.pause();
    }
  }, []);
  useEffect(() => stopAll, [stopAll]);

  const playClip = (src: string, fallbackText: string, dur: number | undefined): { end: Promise<void>; ms: number } => {
    const ms = dur ? dur * 1000 : readingMs(fallbackText);
    const el = players.current.find((p) => p.paused) ?? players.current[0];
    if (!el || !dur) return { end: browserSpeak(fallbackText), ms };
    const end = new Promise<void>((resolve) => {
      const done = () => {
        el.onended = el.onerror = null;
        resolve();
      };
      const guard = setTimeout(done, ms + 3000);
      el.onended = () => {
        clearTimeout(guard);
        done();
      };
      el.onerror = () => {
        clearTimeout(guard);
        browserSpeak(fallbackText).then(done);
      };
      el.src = src;
      el.play().catch(() => {
        clearTimeout(guard);
        browserSpeak(fallbackText).then(done);
      });
    });
    return { end, ms };
  };

  const start = async (ruko: boolean) => {
    stopAll();
    const id = run.current;
    setWithRuko(ruko);
    setShown([]);
    setSpeaker(null);
    setPhase("ring");
    if (sound) {
      stopRing.current = ring();
      // Phones only let a page play sound after a tap: unlock two players now, inside the tap.
      players.current = [new Audio(), new Audio()];
      for (const p of players.current) {
        p.muted = true;
        p.src = "/demo-audio/chime.mp3";
        p.play().then(() => {
          p.pause();
          p.muted = false;
        }).catch(() => {
          p.muted = false;
        });
      }
      if (!manifest.current) {
        try {
          manifest.current = (await (await fetch("/demo-audio/manifest.json")).json()) as Manifest;
        } catch {
          manifest.current = null;
        }
      }
    } else players.current = [];
    await wait(3200);
    stopRing.current?.();
    stopRing.current = null;
    if (id !== run.current) return;
    setPhase("play");
    const { beats } = plan(lang, ruko);
    let prev: { end: Promise<void>; startedAt: number; ms: number } | null = null;
    let chimed = false;
    for (let i = 0; i < beats.length; i++) {
      const b = beats[i];
      if (id !== run.current) return;
      // The caller talks over the end of her sentence; everyone else waits their turn.
      if (prev && b.cutsInMs) await wait(Math.max(0, prev.ms - (Date.now() - prev.startedAt) - b.cutsInMs));
      else if (prev) {
        await prev.end;
        await wait(b.who === "ruko" ? 800 : b.who === "kamala" ? 550 : 350);
      }
      if (id !== run.current) return;
      if (b.who === "ruko" && !chimed && sound) {
        chimed = true;
        const c = playClip("/demo-audio/chime.mp3", "", 0.7);
        await wait(c.ms + 150);
        if (id !== run.current) return;
      }
      setShown(beats.slice(0, i + 1));
      setSpeaker(b.who);
      if (!sound) {
        const ms = readingMs(b.text);
        prev = { end: wait(ms), startedAt: Date.now(), ms };
      } else {
        const clip = playClip(`/demo-audio/${folder(lang)}/${b.id}.mp3`, b.text, manifest.current?.[folder(lang)]?.[b.id]);
        prev = { end: clip.end, startedAt: Date.now(), ms: clip.ms };
      }
    }
    if (prev) await prev.end;
    if (id !== run.current) return;
    setSpeaker(null);
    setPhase("done");
  };

  const en = lang === "en";
  const current = shown[shown.length - 1];
  const scene: Scene | "idle" | "ring" = phase === "idle" ? "idle" : phase === "ring" ? "ring" : (current?.scene ?? "call");
  const T = SCENE_TEXT[lang];
  const busy = phase === "ring" || phase === "play";

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-6 pb-10 text-ink">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-[16px] text-ink-soft underline underline-offset-4">
          Home
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSound((s) => !s);
              hush();
            }}
            aria-pressed={sound}
            aria-label={sound ? "Turn the sound off" : "Turn the sound on"}
            className="grid size-12 place-items-center rounded-full border border-hair"
          >
            {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <button onClick={() => !busy && setLang(en ? "hing" : "en")} disabled={busy} className="min-h-12 rounded-full border border-hair px-4 text-[15px] font-semibold disabled:opacity-40">
            {en ? "English" : "Hinglish"}
          </button>
        </div>
      </div>

      <h1 className="display mt-6 text-[44px] leading-[1.04]">{en ? "Watch Ruko step in" : "Dekhiye Ruko kaise bachata hai"}</h1>
      <p className="mt-3 text-[19px] text-ink-soft">{en ? "A scam call, as it happens. Turn the sound up." : "Ek scam call, jaise hoti hai. Awaaz badhaiye."}</p>
      <p className="mt-2 rounded-xl bg-paper-2 px-3 py-2 text-[15px] text-ink-soft">{T.setup}</p>

      {/* The stage */}
      <section className="mt-6 border-t border-hair pt-5" aria-live="polite">
        {scene === "idle" && (
          <div className="flex flex-col items-start gap-5">
            <Guardian mood="safe" className="size-24" />
            <button onClick={() => void start(true)} className="press min-h-[72px] w-full rounded-[18px] bg-ink text-[22px] font-semibold text-white">
              {en ? "Play the call, with Ruko" : "Call chalaiye, Ruko ke saath"}
            </button>
            <button onClick={() => void start(false)} className="min-h-[64px] w-full rounded-[18px] border border-hair text-[20px] font-semibold">
              {en ? "See it without Ruko" : "Ruko ke bina dekhiye"}
            </button>
          </div>
        )}

        {scene === "ring" && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Phone className="size-10" strokeWidth={1.5} />
            <p className="text-[16px] text-ink-soft">{en ? "Incoming call" : "Incoming call"}</p>
            <p className="display text-[34px]">+91 98111 22334</p>
            <p className="text-[18px] text-ink-soft">{en ? "Unknown number. Ringing…" : "Anjaan number. Ring ho raha hai…"}</p>
          </div>
        )}

        {(phase === "play" || phase === "done") && scene === "call" && (
          <div className="flex items-center gap-4">
            <Guardian mood={moodFor(scene)} className="size-16" />
            <div>
              <p className="text-[15px] text-ink-soft">{en ? "On the call" : "Call par"}</p>
              <p className="text-[20px] font-semibold">{en ? "Unknown number" : "Anjaan number"}</p>
              {withRuko && <p className="text-[16px] text-ink-soft">{en ? "Ruko is listening to the words, with consent." : "Ruko shabd sun raha hai, consent ke saath."}</p>}
            </div>
          </div>
        )}

        {scene === "stop" && (
          <div className="m-fade border-t-[8px] border-alarm pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold tracking-[0.16em] text-alarm uppercase">{en ? "This is a scam" : "Yeh scam hai"}</p>
              <Guardian mood="danger" className="size-12" />
            </div>
            <p className="display mt-1 text-[110px] leading-[0.9] text-alarm">Stop.</p>
            <p className="mt-3 border-l-4 border-alarm pl-3 text-[22px] leading-snug font-semibold">{T.stop}</p>
          </div>
        )}

        {(scene === "after" || scene === "family") && (
          <div className="flex flex-col gap-3">
            <div className="m-rise flex items-center gap-4 rounded-[18px] bg-safe-soft p-4">
              <Guardian mood="after" className="size-16" />
              <p className="text-[21px] leading-snug font-semibold text-safe">{en ? "You have paused. That was a good step." : "Aap ruk gaye. Yeh achha kadam tha."}</p>
            </div>
            {scene === "family" && (
              <div className="m-rise rounded-[18px] border border-hair p-4">
                <p className="text-[14px] font-semibold tracking-[0.14em] text-ink-soft uppercase">{en ? "Priya's phone" : "Priya ka phone"}</p>
                <p className="mt-1 text-[19px] leading-snug">{T.family}</p>
              </div>
            )}
          </div>
        )}

        {scene === "lost" && (
          <div className="m-fade border-t-[8px] border-ink pt-3">
            <p className="display text-[56px] leading-none text-alarm">₹50,000</p>
            <p className="mt-1 text-[22px] font-semibold">{en ? "sent to the scammer. (Simulated.)" : "scammer ko bheja gaya. (Simulated.)"}</p>
            <p className="mt-3 text-[18px] text-ink-soft">{en ? "Nobody shamed her. This is how these calls work on anyone." : "Isme unki galti nahi. Aisi calls kisi par bhi aise hi kaam karti hain."}</p>
          </div>
        )}
      </section>

      {/* What is being said right now */}
      {current && (
        <section className="mt-4 rounded-[18px] bg-paper-2 p-4" aria-live="polite">
          <p className="text-[14px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
            {NAME[current.who][lang]}
            {speaker === current.who ? (en ? " · speaking" : " · bol raha hai") : ""}
          </p>
          <p className="display mt-1 text-[26px] leading-snug">&ldquo;{current.text}&rdquo;</p>
        </section>
      )}

      {phase === "done" && (
        <section className="m-rise mt-6 border-t border-ink pt-4">
          <p className="display text-[30px] leading-tight">{withRuko ? T.withEnd : T.withoutEnd}</p>
          <div className="mt-5 flex flex-col gap-3">
            {withRuko ? (
              <button onClick={() => void start(false)} className="min-h-[64px] rounded-[18px] bg-ink text-[20px] font-semibold text-white">
                {en ? "Now see it without Ruko" : "Ab Ruko ke bina dekhiye"}
              </button>
            ) : (
              <button onClick={() => void start(true)} className="min-h-[64px] rounded-[18px] bg-ink text-[20px] font-semibold text-white">
                {en ? "Now see it with Ruko" : "Ab Ruko ke saath dekhiye"}
              </button>
            )}
            <Link href="/check" className="flex min-h-[64px] items-center justify-center rounded-[18px] border border-hair text-[20px] font-semibold">
              {en ? "Try the real check" : "Asli check try kijiye"}
            </Link>
          </div>
        </section>
      )}

      {busy && (
        <button
          onClick={() => {
            stopAll();
            setPhase("idle");
            setShown([]);
            setSpeaker(null);
          }}
          className="mt-6 min-h-12 self-start text-[16px] text-ink-soft underline underline-offset-4"
        >
          {en ? "Stop the demo" : "Demo roakiye"}
        </button>
      )}

      {shown.length > 0 && (
        <details className="mt-8 text-[17px]">
          <summary className="min-h-12 cursor-pointer py-2 font-semibold">{en ? "Read the whole call" : "Poori call padhiye"}</summary>
          <ul className="mt-2 flex flex-col gap-3">
            {shown.map((b, i) => (
              <li key={i}>
                <span className="font-semibold">{NAME[b.who][lang]}: </span>
                {b.text}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-8 text-[14px] leading-snug text-ink-soft">
        {en
          ? "A role-play. The caller and Kamala are actors with synthetic voices. No real call is made or recorded, and no real money is involved. Ruko speaks only when its own scam check says STOP."
          : "Yeh role-play hai. Caller aur Kamala actors hain, awaazein nakli hain. Koi asli call nahi hoti aur koi record nahi hota, na hi asli paise lagte hain. Ruko tabhi bolta hai jab uska apna scam check STOP kehta hai."}
      </p>
    </main>
  );
}
