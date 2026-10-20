"use client";

import {
  Check,
  ChevronRight,
  Landmark,
  LifeBuoy,
  MessageCircleHeart,
  Phone,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { Avatar, ElderShell } from "@/components/elder/ui";
import { NumberCheck } from "@/components/radar/NumberCheck";
import { VerifiedCallBanner } from "@/components/radar/VerifiedCall";
import { usePatternLibrary } from "@/lib/client";
import { useLang } from "@/lib/i18n";

// The elder's Ruko home (v2): a calm "you are protected" status, one big
// "Is this a scam?" button, their trusted person one tap away, and the
// silent "Tell my family" (no confirmation, nothing a scammer on video would notice).

interface Warning {
  id: string;
  at: string;
  source: "agent" | "signal" | "bank" | "elder";
  level: "stop" | "caution";
  patternId: string | null;
}

export function ElderHome({
  elderId,
  name,
  demo,
  signedIn,
  trusted,
}: {
  elderId: string;
  name: string;
  demo: boolean;
  signedIn: boolean;
  trusted?: { name: string; phone: string };
}) {
  const { t, toggle, lang } = useLang();
  const lib = usePatternLibrary();
  const [protection, setProtection] = useState(false);
  const [family, setFamily] = useState(0);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [sent, setSent] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c, w] = await Promise.all([
          fetch(`/api/protection?elderId=${elderId}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/circle?elderId=${elderId}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/warnings?elderId=${elderId}`, { cache: "no-store" }).then((r) => r.json()),
        ]);
        setProtection(Boolean(p.active));
        setFamily(c.members?.length ?? 0);
        if (Array.isArray(w)) setWarnings(w);
        setNow(Date.now());
      } catch {}
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [elderId]);

  const tellFamily = async () => {
    if (sent) return;
    setSent(true);
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderId }),
    }).catch(() => {});
  };

  const warningLabel = (w: Warning) => {
    const pattern = w.patternId ? lib.patterns.find((p) => p.id === w.patternId)?.name[lang] : undefined;
    const kind = w.source === "bank" ? t.warningBank : w.source === "elder" ? t.warningFamily : w.level === "stop" ? t.warningStop : t.warningCaution;
    return pattern ? `${kind}: ${pattern}` : kind;
  };

  return (
    <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle}>
      <div className="flex flex-col gap-5 animate-in fade-in duration-300">
        {demo && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold-soft px-3 py-1 text-[14px] font-bold text-warn">{t.demoBadge}</span>
            {!signedIn && (
              <Link href="/login?next=/start" className="text-[15px] font-bold text-calm underline underline-offset-4">
                {t.signInCta}
              </Link>
            )}
          </div>
        )}

        <div>
          <h1 className="text-[30px] leading-tight font-bold tracking-tight">{t.homeGreeting(name.split(" ")[0])}</h1>
          {protection ? (
            <p className="mt-2 flex gap-3 rounded-2xl bg-warn-soft p-4 text-[17px] font-bold text-warn">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.4} />
              {t.protectionOn}
            </p>
          ) : (
            <p className="mt-1 flex items-center gap-2 text-[18px] font-bold text-calm">
              <ShieldCheck className="size-5" strokeWidth={2.4} />
              {t.youAreProtected}
            </p>
          )}
        </div>

        <VerifiedCallBanner elderId={elderId} t={t} lang={lang} />

        <Link
          href="/check"
          className="emerald-card flex min-h-[148px] flex-col justify-between rounded-[28px] p-6 text-white shadow-lift transition active:scale-[0.99]"
        >
          <ShieldQuestion className="size-10" strokeWidth={2} />
          <span>
            <span className="block text-[30px] leading-tight font-bold">{t.isThisScam}</span>
            <span className="block text-[17px] text-white/80">{t.isThisScamSub}</span>
          </span>
        </Link>

        {trusted ? (
          <a
            href={`tel:${trusted.phone.replace(/\s/g, "")}`}
            className="flex min-h-[84px] items-center gap-4 rounded-[24px] bg-white p-4 shadow-soft active:scale-[0.99]"
          >
            <Avatar name={trusted.name} size="size-14" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ink-soft">{t.yourTrusted}</span>
              <span className="block truncate text-[21px] font-bold">{t.callTrusted(trusted.name.split(" ")[0])}</span>
            </span>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-calm text-white">
              <Phone className="size-6" strokeWidth={2.4} />
            </span>
          </a>
        ) : (
          <Link href="/circle" className="flex min-h-[72px] items-center gap-4 rounded-[24px] border-2 border-dashed border-calm/35 p-4 font-bold text-calm">
            <Users className="size-6" strokeWidth={2.2} />
            <span className="flex-1 text-[19px]">{t.addTrusted}</span>
            <ChevronRight className="size-5" />
          </Link>
        )}

        {/* Silent: a soft card, not an alarm. After the tap only a small tick appears. */}
        <button
          onClick={tellFamily}
          className="flex min-h-[84px] items-center gap-4 rounded-[24px] bg-white p-4 text-left shadow-soft transition active:scale-[0.99]"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-calm-soft text-calm">
            {sent ? <Check className="size-7" strokeWidth={2.6} /> : <MessageCircleHeart className="size-7" strokeWidth={2.2} />}
          </span>
          <span className="min-w-0">
            <span className="block text-[21px] font-bold">{t.tellFamily}</span>
            <span className="block text-[16px] text-ink-soft">{sent ? t.tellFamilySent : t.tellFamilySub}</span>
          </span>
        </button>

        <NumberCheck t={t} lang={lang} lib={lib} elderId={elderId} />

        <section>
          <h2 className="text-[19px] font-bold text-ink-soft">{t.recentWarnings}</h2>
          {warnings.length === 0 ? (
            <p className="mt-1 text-[17px] text-ink-soft">{t.noWarnings}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {warnings.map((w) => (
                <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
                  <span className={`size-3 shrink-0 rounded-full ${w.level === "stop" ? "bg-alarm" : "bg-gold"}`} />
                  <span className="min-w-0 flex-1 text-[17px] leading-snug font-bold">{warningLabel(w)}</span>
                  {now > 0 && (
                    <span className="shrink-0 text-[14px] text-ink-soft tabular">{t.whenAgo(Math.max(0, Math.round((now - Date.parse(w.at)) / 60_000)))}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-3 gap-3">
          <Tile href="/circle" icon={Users} title={t.rukoFamily} sub={t.circleCount(family)} />
          <Tile href="/bank" icon={Landmark} title={t.practiceBank} />
          <Tile href="/settings" icon={Settings} title={t.settingsTitle} />
        </div>

        <Link
          href="/help"
          className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 border-alarm/30 text-[19px] font-bold text-alarm"
        >
          <LifeBuoy className="size-6" strokeWidth={2.2} />
          {t.scammedButton}
        </Link>
      </div>
    </ElderShell>
  );
}

function Tile({ href, icon: I, title, sub }: { href: string; icon: typeof Users; title: string; sub?: string }) {
  return (
    <Link href={href} className="flex min-h-[104px] flex-col justify-between rounded-[22px] bg-white p-4 shadow-soft">
      <I className="size-6 text-calm" strokeWidth={2.2} />
      <span>
        <span className="block text-[16px] leading-tight font-bold">{title}</span>
        {sub && <span className="block text-[13px] text-ink-soft">{sub}</span>}
      </span>
    </Link>
  );
}
