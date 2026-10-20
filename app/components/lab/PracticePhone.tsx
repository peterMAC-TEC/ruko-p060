"use client";

import { ChevronLeft, MessageSquare, Phone, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RukoMark } from "@/components/brand/RukoMark";
import { practiceEvent } from "@/lib/client";

// The participant's practice phone during the trial: a plain home screen with
// the practice bank, Ruko (or "paused" in a without-Ruko call), Messages and
// Phone. The scam scripts ask for "the code on your screen": it arrives here
// as a message, clearly marked DRILL. Nothing on this phone is real.

interface State {
  code: string | null;
  live: boolean;
  rukoOn: boolean;
  message: { from: string; text: string } | null;
}

export function PracticePhone({ accountId }: { accountId: string }) {
  const [s, setS] = useState<State | null>(null);
  const [view, setView] = useState<"home" | "messages" | "phone" | "paused">("home");
  const [banner, setBanner] = useState(false);
  const [clock, setClock] = useState("");
  const lastMsg = useRef<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const r = await fetch(`/api/practice?account=${accountId}`, { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const d: State = await r.json();
      setS(d);
      if (d.message && d.message.text !== lastMsg.current) {
        lastMsg.current = d.message.text;
        setBanner(true);
        setTimeout(() => setBanner(false), 6000);
      }
    };
    load();
    const id = setInterval(load, 2500);
    const tick = () => setClock(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const c = setInterval(tick, 15000);
    return () => {
      clearInterval(id);
      clearInterval(c);
    };
  }, [accountId]);

  const open = (v: typeof view) => {
    setView(v);
    if (v === "messages") practiceEvent(accountId, "messages_opened");
    if (v === "paused") practiceEvent(accountId, "ruko_paused_seen");
  };

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col overflow-hidden bg-gradient-to-b from-[#1f3b3a] via-[#2a4d4a] to-[#14201f] text-white">
      <div className="flex items-center justify-between px-5 pt-3 text-[15px] font-bold tabular">
        <span>{clock}</span>
        <span className="text-[12px] text-white/50">Practice phone{s?.code ? ` · ${s.code}` : ""}</span>
      </div>

      {banner && s?.message && (
        <button
          onClick={() => open("messages")}
          className="absolute inset-x-3 top-9 z-10 flex gap-3 rounded-2xl bg-white/95 p-3 text-left text-ink shadow-xl animate-in slide-in-from-top-4 duration-300"
        >
          <MessageSquare className="mt-0.5 size-5 shrink-0 text-calm" />
          <span>
            <span className="block text-[14px] font-bold">{s.message.from}</span>
            <span className="block text-[17px] leading-snug">{s.message.text}</span>
          </span>
        </button>
      )}

      {view === "home" && (
        <div className="flex flex-1 flex-col px-6 pt-20">
          <p className="text-center text-[64px] leading-none font-light tabular">{clock}</p>
          <div className="mt-auto mb-16 grid grid-cols-2 gap-6">
            <Icon href="/bank" label="Sahyog Bank" bg="bg-ink">
              <span className="text-[30px] font-bold text-gold">S</span>
            </Icon>
            {s?.rukoOn === false ? (
              <IconButton onClick={() => open("paused")} label="Ruko (paused)" bg="bg-white/20">
                <RukoMark className="size-9 text-white/50" />
              </IconButton>
            ) : (
              <Icon href="/app" label="Ruko" bg="bg-calm">
                <RukoMark className="size-9 text-white" />
              </Icon>
            )}
            <IconButton onClick={() => open("messages")} label="Messages" bg="bg-[#30a46c]" badge={Boolean(s?.message)}>
              <MessageSquare className="size-8" />
            </IconButton>
            <IconButton onClick={() => open("phone")} label="Phone" bg="bg-[#3e63dd]">
              <Phone className="size-8" />
            </IconButton>
          </div>
        </div>
      )}

      {view !== "home" && (
        <div className="flex flex-1 flex-col bg-paper text-ink">
          <button onClick={() => setView("home")} className="flex min-h-14 items-center gap-1 px-4 text-[18px] font-bold text-calm">
            <ChevronLeft className="size-6" /> Home
          </button>
          {view === "messages" && (
            <div className="flex flex-col gap-3 px-5">
              <h1 className="text-[26px] font-bold">Messages</h1>
              {s?.message ? (
                <div className="rounded-2xl bg-white p-4 shadow-soft">
                  <p className="text-[15px] font-bold text-ink-soft">{s.message.from}</p>
                  <p className="mt-1 text-[21px] leading-snug">{s.message.text}</p>
                </div>
              ) : (
                <p className="text-[19px] text-ink-soft">No new messages.</p>
              )}
            </div>
          )}
          {view === "phone" && (
            <div className="flex flex-col gap-3 px-5">
              <h1 className="text-[26px] font-bold">Phone</h1>
              <a href="tel:1930" className="flex min-h-16 items-center gap-3 rounded-2xl bg-white px-4 text-[20px] font-bold shadow-soft">
                <Phone className="size-6 text-alarm" /> 1930 · Cyber fraud helpline
              </a>
              <p className="text-[17px] text-ink-soft">Your family&apos;s numbers are on your own phone. In this practice session you can also just tell the facilitator.</p>
            </div>
          )}
          {view === "paused" && (
            <div className="flex flex-col gap-3 px-5">
              <ShieldQuestion className="size-10 text-ink-soft" />
              <h1 className="text-[26px] leading-tight font-bold">Ruko is paused for this practice call.</h1>
              <p className="text-[19px] text-ink-soft">This call tests how things go without Ruko. Do whatever you would normally do.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Icon({ href, label, bg, children }: { href: string; label: string; bg: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2">
      <span className={`flex size-20 items-center justify-center rounded-[22px] shadow-lg ${bg}`}>{children}</span>
      <span className="text-[17px] font-bold">{label}</span>
    </Link>
  );
}

function IconButton({ onClick, label, bg, badge, children }: { onClick: () => void; label: string; bg: string; badge?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span className={`relative flex size-20 items-center justify-center rounded-[22px] shadow-lg ${bg}`}>
        {children}
        {badge && <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-alarm text-[13px] font-bold">1</span>}
      </span>
      <span className="text-[17px] font-bold">{label}</span>
    </button>
  );
}

/** A small pill on practice-phone screens to get back to the home screen. */
export function PracticeHomeButton() {
  return (
    <Link
      href="/phone"
      className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink/85 px-5 py-2 text-[15px] font-bold text-white shadow-lg backdrop-blur"
    >
      ● Home
    </Link>
  );
}
