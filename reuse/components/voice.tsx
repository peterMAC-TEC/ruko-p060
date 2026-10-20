"use client";

import { useState, type ReactNode } from "react";
import { useHoldToTalk, type VoiceOutcome } from "@/lib/voice/hold-to-talk";

export type VoiceMode = "claim" | "card" | "people";

/** What the server understood; the shape depends on the mode. */
export interface VoiceReply {
  ok: boolean;
  reason?: string;
  engine?: "ai" | "local";
  heard?: string;
  everyone?: boolean;
  items?: { lineId: string; name?: string; units: number; shared: boolean; phrase?: string; confidence?: number }[];
  people?: { personId?: string; name?: string; units?: number; isVeg?: boolean; noAlcohol?: boolean; isBirthday?: boolean; phrase?: string; confidence?: number }[];
  unmatched?: string[];
}

function Mic({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

/**
 * Press and hold to talk; let go to send. Shows the words live while listening.
 * Tapping always works too: this is a shortcut, never the only way.
 */
export function HoldToTalk({
  tabId,
  adminKey,
  mode,
  fields = {},
  label = "Hold to say it",
  onReply,
}: {
  tabId: string;
  adminKey: string;
  mode: VoiceMode;
  fields?: Record<string, string>;
  label?: string;
  onReply: (reply: VoiceReply) => void;
}) {
  const [thinking, setThinking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const voice = useHoldToTalk(send);

  async function send(outcome: VoiceOutcome) {
    setThinking(true);
    setNote(null);
    const form = new FormData();
    form.append("mode", mode);
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    if (outcome.engine === "browser") form.append("transcript", outcome.transcript);
    else form.append("audio", outcome.audio, `voice.${outcome.audio.type.includes("mp4") ? "mp4" : outcome.audio.type.includes("ogg") ? "ogg" : "webm"}`);
    let reply: VoiceReply;
    try {
      const res = await fetch(`/api/tabs/${tabId}/voice`, { method: "POST", headers: { "x-admin-key": adminKey }, body: form });
      reply = await res.json();
    } catch {
      reply = { ok: false, reason: "offline" };
    }
    setThinking(false);
    const empty = reply.ok && !reply.everyone && !reply.items?.length && !reply.people?.length;
    if (!reply.ok || empty) {
      // Garbled speech-to-text: next time send the recording itself to the AI.
      if (voice.canSwitchToAudio) voice.switchToAudio();
      setNote(
        reply.reason === "offline"
          ? "No connection. Tap instead."
          : reply.reason === "limit"
            ? "Voice is used up for this tab. Tap instead."
            : empty
              ? `Heard "${reply.heard ?? "…"}" but couldn't match it. Hold and try again, or tap.`
              : "Couldn't make that out. Hold and try again, or tap.",
      );
      return;
    }
    onReply(reply);
  }

  if (!voice.supported) {
    return <p className="text-sm text-muted">Voice isn&apos;t available in this browser. Tap instead.</p>;
  }

  const listening = voice.state === "listening";
  return (
    <div className="flex flex-col gap-2">
      {(listening || thinking) && (
        <p className="rounded-2xl bg-raised px-4 py-3 text-lg leading-snug" aria-live="polite">
          {thinking ? <span className="text-muted">Working out what you said…</span> : voice.interim || <span className="text-muted">Listening…</span>}
        </p>
      )}
      <button
        type="button"
        aria-pressed={listening}
        onPointerDown={(e) => {
          try {
            e.currentTarget.setPointerCapture(e.pointerId); // keep "holding" even if the finger slides
          } catch {
            // Some browsers refuse capture; holding still works.
          }
          void voice.start();
        }}
        onPointerUp={voice.stop}
        onPointerCancel={voice.stop}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          if (listening) voice.stop();
          else void voice.start();
        }}
        disabled={thinking}
        className={`flex min-h-14 w-full touch-none items-center justify-center gap-2 rounded-2xl border text-lg font-semibold select-none transition ${
          listening ? "scale-[1.02] border-neon bg-neon/20 text-neon shadow-[0_0_28px_-4px] shadow-neon/70" : "border-edge bg-surface text-ink"
        }`}
      >
        <Mic className={`size-6 ${listening ? "animate-pulse" : ""}`} />
        {listening ? "Listening… let go to send" : thinking ? "One sec…" : label}
      </button>
      {(note || voice.error) && <p className="text-sm text-warn">{note ?? voice.error}</p>}
    </div>
  );
}

/** "Here's what I understood": the words with matched phrases highlighted, the result as chips, and a choice. */
export function VoiceHeard({
  heard,
  phrases,
  chips,
  onUse,
  onDismiss,
  footnote,
}: {
  heard: string;
  phrases: string[];
  chips: ReactNode[];
  onUse: () => void;
  onDismiss: () => void;
  footnote?: string;
}) {
  return (
    <section className="rounded-2xl border border-neon/40 bg-neon/10 p-4" aria-live="polite">
      <p className="text-sm text-muted">You said</p>
      <p className="mt-1 text-lg leading-snug">&ldquo;{highlight(heard, phrases)}&rdquo;</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <span key={i} className="rounded-full bg-neon/20 px-3 py-1 text-sm font-semibold text-neon">
            {c}
          </span>
        ))}
      </div>
      {footnote && <p className="mt-2 text-xs text-muted">{footnote}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onUse} className="min-h-12 rounded-xl bg-neon font-semibold text-neon-ink">
          Use this
        </button>
        <button type="button" onClick={onDismiss} className="min-h-12 rounded-xl border border-edge font-semibold">
          Not quite
        </button>
      </div>
    </section>
  );
}

/** Wrap each matched phrase in a highlight. */
function highlight(text: string, phrases: string[]): ReactNode {
  const marks = phrases.map((p) => p.trim()).filter((p) => p.length > 1);
  if (!marks.length) return text;
  const pattern = new RegExp(`(${marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(pattern).map((part, i) =>
    marks.some((m) => m.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i} className="rounded bg-neon/30 px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
