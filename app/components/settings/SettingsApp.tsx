"use client";

import { Check, ChevronRight, KeyRound, Languages, ShieldCheck, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { Avatar, ElderShell, Title } from "@/components/elder/ui";
import { NOTICES, PURPOSES, type Purpose } from "@/lib/consent";
import { useLang } from "@/lib/i18n";
import type { Sensitivity } from "@/lib/radar";

// Settings (v2 §3.9): language, trusted person, how readily STOP appears, each
// consent on its own switch, and "Delete my data". One setting per card.

const LEVELS: Sensitivity[] = ["high", "normal", "low"];

export function SettingsApp({
  userId,
  demo,
  signedIn,
  initialSensitivity,
  initialConsents,
  trusted,
  hasDuressPin = false,
}: {
  userId: string;
  demo: boolean;
  signedIn: boolean;
  initialSensitivity: Sensitivity;
  initialConsents: Purpose[];
  trusted?: { name: string; phone: string };
  hasDuressPin?: boolean;
}) {
  const { t, toggle, lang } = useLang();
  const [sensitivity, setSensitivity] = useState(initialSensitivity);
  const [consents, setConsents] = useState<Purpose[]>(initialConsents);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState("");

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const pickSensitivity = async (s: Sensitivity) => {
    setSensitivity(s);
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(demo ? { sensitivity: s, demoUserId: userId } : { sensitivity: s }),
    }).catch(() => null);
    if (r?.ok) flash();
  };

  const flip = async (p: Purpose) => {
    if (demo) return;
    const on = consents.includes(p);
    const r = await fetch("/api/consents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(on ? { revoke: [p], lang } : { grant: [p], lang }),
    }).catch(() => null);
    if (r?.ok) {
      setConsents((await r.json()).consents);
      flash();
    }
  };

  const deleteAll = async () => {
    setError("");
    const r = await fetch("/api/me", { method: "DELETE" }).catch(() => null);
    if (r?.ok) setDeleted(true);
    else setError((await r?.json().catch(() => null))?.error ?? "Couldn't delete right now.");
  };

  if (deleted) {
    return (
      <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle}>
        <div className="flex flex-col gap-5 pt-6">
          <span className="flex size-16 items-center justify-center rounded-full bg-calm-soft text-calm">
            <Check className="size-8" strokeWidth={2.6} />
          </span>
          <Title>{t.deleted}</Title>
          <Link href="/" className="text-[18px] font-bold text-calm underline underline-offset-4">
            Ruko
          </Link>
        </div>
      </ElderShell>
    );
  }

  return (
    <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle}>
      <div className="flex flex-col gap-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between gap-3">
          <Title>{t.settingsTitle}</Title>
          {saved && (
            <span className="flex items-center gap-1 rounded-full bg-calm-soft px-3 py-1 text-[15px] font-bold text-calm">
              <Check className="size-4" /> {t.saved}
            </span>
          )}
        </div>
        {demo && <p className="self-start rounded-full bg-paper-2 px-3 py-1 text-[14px] font-semibold text-ink-soft">{t.demoBadge}</p>}

        <button onClick={toggle} className="flex min-h-16 items-center gap-4 rounded-3xl bg-white p-5 text-left shadow-soft">
          <Languages className="size-6 text-calm" strokeWidth={2.2} />
          <span className="flex-1 text-[20px] font-bold">{lang === "en" ? "English" : "हिंदी"}</span>
          <span className="text-[16px] font-bold text-calm">{t.language}</span>
        </button>

        <Link href="/circle" className="flex min-h-20 items-center gap-4 rounded-3xl bg-white p-5 shadow-soft">
          {trusted ? <Avatar name={trusted.name} /> : <Users className="size-6 text-calm" strokeWidth={2.2} />}
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-ink-soft">{t.yourTrusted}</span>
            <span className="block truncate text-[20px] font-bold">{trusted ? trusted.name : t.addTrusted}</span>
          </span>
          <ChevronRight className="size-5 text-ink/30" />
        </Link>

        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="text-[21px] font-bold">{t.sensitivityTitle}</h2>
          <div className="mt-3 flex flex-col gap-2" role="radiogroup">
            {LEVELS.map((s) => {
              const on = sensitivity === s;
              return (
                <button
                  key={s}
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickSensitivity(s)}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left ${on ? "border-calm bg-calm-soft" : "border-ink/10"}`}
                >
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-calm bg-calm" : "border-ink/25"}`}>
                    {on && <Check className="size-4 text-white" strokeWidth={3} />}
                  </span>
                  <span>
                    <span className="block text-[19px] font-bold">{t.sensitivity[s].label}</span>
                    <span className="block text-[16px] text-ink-soft">{t.sensitivity[s].sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-[21px] font-bold">
            <ShieldCheck className="size-6 text-calm" strokeWidth={2.2} />
            {t.dataTitle}
          </h2>
          <p className="mt-1 text-[17px] text-ink-soft">{t.dataBody}</p>
          <ul className="mt-3 flex flex-col divide-y divide-ink/8">
            {PURPOSES.map((p) => {
              const on = demo || consents.includes(p);
              return (
                <li key={p} className="flex items-center gap-3 py-3">
                  <span className="flex-1 text-[17px] leading-snug font-bold">{NOTICES[lang][p].title}</span>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={NOTICES[lang][p].title}
                    disabled={demo}
                    onClick={() => flip(p)}
                    className={`relative h-9 w-16 shrink-0 rounded-full transition ${on ? "bg-calm" : "bg-ink/20"} disabled:opacity-60`}
                  >
                    <span className={`absolute top-1 size-7 rounded-full bg-white shadow transition-all ${on ? "left-8" : "left-1"}`} />
                  </button>
                </li>
              );
            })}
          </ul>
          {demo && <p className="mt-2 text-[15px] text-ink-soft">{t.signInToChange}</p>}
        </section>

        <SafetyPin userId={userId} demo={demo} initial={hasDuressPin} onSaved={flash} />

        <section className="rounded-3xl border-2 border-alarm/20 p-5">
          {demo || !signedIn ? (
            <p className="text-[17px] text-ink-soft">{t.demoNoDelete}</p>
          ) : confirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-[18px] font-bold">{t.deleteConfirm}</p>
              <button onClick={deleteAll} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-alarm text-[19px] font-bold text-white">
                <Trash2 className="size-5" />
                {t.deleteYes}
              </button>
              <button onClick={() => setConfirm(false)} className="min-h-14 rounded-2xl border-2 border-ink/12 text-[19px] font-bold">
                {t.deleteNo}
              </button>
              {error && <p className="text-alarm">{error}</p>}
            </div>
          ) : (
            <button onClick={() => setConfirm(true)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl text-[19px] font-bold text-alarm">
              <Trash2 className="size-5" />
              {t.deleteData}
            </button>
          )}
        </section>

        {signedIn && !demo && (
          <form action="/auth/signout" method="post">
            <button className="text-[16px] text-ink-soft underline underline-offset-4">Sign out</button>
          </form>
        )}
      </div>
    </ElderShell>
  );
}

/**
 * The duress ("safety") PIN: typed instead of the normal PIN when someone is
 * forcing a payment. Setting or removing it needs the current normal PIN.
 */
function SafetyPin({ userId, demo, initial, onSaved }: { userId: string; demo: boolean; initial: boolean; onSaved: () => void }) {
  const { t } = useLang();
  const [on, setOn] = useState(initial);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (remove: boolean) => {
    setBusy(true);
    setError("");
    const r = await fetch("/api/pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderId: userId, currentPin: current, duressPin: remove ? null : next }),
    }).catch(() => null);
    setBusy(false);
    const d = await r?.json().catch(() => null);
    if (!r?.ok) return setError(d?.error ?? "Couldn't save.");
    setOn(Boolean(d.hasDuressPin));
    setCurrent("");
    setNext("");
    onSaved();
  };

  const pinInput = (label: string, value: string, set: (v: string) => void) => (
    <label className="block">
      <span className="text-[16px] font-bold text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(e) => set(e.target.value.replace(/D/g, "").slice(0, 4))}
        inputMode="numeric"
        type="password"
        autoComplete="off"
        className="mt-1 min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-paper px-4 text-[22px] tracking-[0.4em] outline-none focus:border-calm"
      />
    </label>
  );

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-[21px] font-bold">
        <KeyRound className="size-6 text-calm" strokeWidth={2.2} />
        {t.safetyTitle}
      </h2>
      <p className="mt-1 text-[17px] text-ink-soft">{t.safetyBody}</p>
      <p className={`mt-2 text-[16px] font-bold ${on ? "text-calm" : "text-ink-soft"}`}>{on ? `✓ ${t.safetyOn}` : t.safetyOff}</p>
      {demo && <p className="mt-1 text-[15px] text-warn">{t.safetyDemo}</p>}
      <div className="mt-3 flex flex-col gap-3">
        {pinInput(t.safetyCurrent, current, setCurrent)}
        {pinInput(t.safetyNew, next, setNext)}
        <p className="text-[15px] text-ink-soft">{t.safetyRule}</p>
        {error && <p className="text-[16px] font-bold text-alarm">{error}</p>}
        <button
          onClick={() => save(false)}
          disabled={busy || current.length !== 4 || next.length !== 4}
          className="min-h-14 rounded-2xl bg-calm text-[18px] font-bold text-white disabled:bg-calm/30"
        >
          {t.safetySave}
        </button>
        {on && (
          <button onClick={() => save(true)} disabled={busy || current.length !== 4} className="min-h-12 text-[16px] font-bold text-ink-soft underline disabled:opacity-50">
            {t.safetyRemove}
          </button>
        )}
      </div>
    </section>
  );
}
