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

function voiceFor(role: Who): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const all = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const indian = all.filter((v) => /en[-_]IN/i.test(v.lang));
  const pool = indian.length >= 2 ? indian : all;
  const male = pool.filter((v) => /male|david|mark|james|ravi|hemant|prabhat|rishi|guy|george|daniel|ryan|alex|fred|ravi/i.test(v.name) && !/female/i.test(v.name));
  const female = pool.filter((v) => /female|heera|zira|aria|swara|neerja|veena|samantha|karen|sonia|jenny|susan|emma|libby|moira|tessa|kalpana/i.test(v.name));
  if (role === "scammer") return male[0] ?? pool[0];
  if (role === "kamala") return female[0] ?? pool[1] ?? pool[0];
  return female[1] ?? male[1] ?? pool[2] ?? pool[0];
}

const STYLE: Record<Who, { pitch: number; rate: number }> = {
  scammer: { pitch: 0.6, rate: 1.1 },
  kamala: { pitch: 1.25, rate: 0.86 },
  ruko: { pitch: 1.0, rate: 0.9 },
};

function speak(role: Who, text: string, on: boolean): Promise<void> {
  return new Promise((resolve) => {
    if (!on || typeof window === "undefined" || !("speechSynthesis" in window)) return void setTimeout(resolve, readingMs(text));
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-IN";
    const v = voiceFor(role);
    if (v) u.voice = v;
    u.pitch = STYLE[role].pitch;
    u.rate = STYLE[role].rate;
    const guard = setTimeout(resolve, readingMs(text) + 6000); // never get stuck on a voice that does not report back
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    u.onend = done;
    u.onerror = done;
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
  const stopRing = useRef<(() => void) | null>(null);

  const stopAll = useCallback(() => {
    run.current++;
    stopRing.current?.();
    stopRing.current = null;
    hush();
  }, []);
  useEffect(() => stopAll, [stopAll]);

  const start = async (ruko: boolean) => {
    stopAll();
    const id = run.current;
    setWithRuko(ruko);
    setShown([]);
    setSpeaker(null);
    setPhase("ring");
    if (sound) stopRing.current = ring();
    await wait(3200);
    stopRing.current?.();
    stopRing.current = null;
    if (id !== run.current) return;
    setPhase("play");
    const { beats } = plan(lang, ruko);
    for (let i = 0; i < beats.length; i++) {
      if (id !== run.current) return;
      setShown(beats.slice(0, i + 1));
      setSpeaker(beats[i].who);
      await speak(beats[i].who, beats[i].text, sound);
      await wait(beats[i].who === "ruko" ? 700 : 450);
    }
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
