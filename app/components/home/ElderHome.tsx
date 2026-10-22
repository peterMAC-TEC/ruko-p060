"use client";

import { ArrowRight, Check, ChevronRight, Headphones, Landmark, LifeBuoy, MessageCircleHeart, Phone, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { ElderShell } from "@/components/elder/ui";
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
          fetch(`/api/protection?elderId=${elderId}`, {
            cache: "no-store",
          }).then((r) => r.json()),
          fetch(`/api/circle?elderId=${elderId}`, { cache: "no-store" }).then(
            (r) => r.json(),
          ),
          fetch(`/api/warnings?elderId=${elderId}`, { cache: "no-store" }).then(
            (r) => r.json(),
          ),
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
    const pattern = w.patternId
      ? lib.patterns.find((p) => p.id === w.patternId)?.name[lang]
      : undefined;
    const kind =
      w.source === "bank"
        ? t.warningBank
        : w.source === "elder"
          ? t.warningFamily
          : w.level === "stop"
            ? t.warningStop
            : t.warningCaution;
    return pattern ? `${kind}: ${pattern}` : kind;
  };

  const first = name.split(" ")[0];
  return (
    <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle}>
      <div className="flex flex-1 flex-col animate-in fade-in duration-300">
        {demo && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-soft">
            <span>{t.demoBadge}</span>
            {!signedIn && (
              <Link href="/login?next=/start" className="font-semibold text-ink underline underline-offset-4">
                {t.signInCta}
              </Link>
            )}
          </div>
        )}

        <h1 className="display mt-8 text-[68px] leading-[0.95] whitespace-pre-line">{`${t.homeGreeting(first).replace(", ", ",\n")}.`}</h1>
        {protection ? (
          <p className="mt-5 rounded-[18px] bg-warn-soft p-4 text-[17px] font-semibold text-warn">{t.protectionOn}</p>
        ) : (
          <p className="mt-4 flex items-center gap-2.5 text-[17px] text-ink-soft">
            <span className="size-2 rounded-full bg-ink" />
            {t.youAreProtected}
          </p>
        )}

        <VerifiedCallBanner elderId={elderId} t={t} lang={lang} />

        <Link href="/check" className="mt-8 flex min-h-[104px] items-center justify-between rounded-[20px] bg-ink px-7 text-white transition active:scale-[0.99]">
          <span>
            <span className="display block text-[38px] leading-none italic">{t.isThisScam}</span>
            <span className="mt-2 block text-[16px] text-white/70">{t.isThisScamSub}</span>
          </span>
          <ArrowRight className="size-8 shrink-0" strokeWidth={1.6} />
        </Link>

        <nav className="mt-auto pt-10">
          <div className="border-t border-hair">
            {trusted ? (
              <ListRow href={`tel:${trusted.phone.replace(/\s/g, "")}`} title={t.callTrusted(trusted.name.split(" ")[0])} sub={t.yourTrusted} icon={Phone} />
            ) : (
              <ListRow href="/circle" title={t.addTrusted} icon={Users} />
            )}
            <ListRow href="/companion" title={t.talkToRuko} sub={t.talkToRukoSub} icon={Headphones} />
            {/* Silent: after the tap only a small tick appears, nothing a scammer on video would notice. */}
            <ListRow onClick={tellFamily} title={t.tellFamily} sub={sent ? t.tellFamilySent : t.tellFamilySub} icon={sent ? Check : MessageCircleHeart} />
            <ListRow href="/help" title={t.scammedButton} icon={LifeBuoy} tone="alarm" />
          </div>

          <details className="group mt-2">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[18px] font-semibold text-ink-soft">
              {t.moreTools}
              <ChevronRight className="size-5 transition group-open:rotate-90" />
            </summary>
            <div className="flex flex-col gap-6 pt-2 pb-4">
              <NumberCheck t={t} lang={lang} lib={lib} elderId={elderId} />

              <section>
                <h2 className="text-[18px] font-semibold text-ink-soft">{t.recentWarnings}</h2>
                {warnings.length === 0 ? (
                  <p className="mt-1 text-[17px] text-ink-soft">{t.noWarnings}</p>
                ) : (
                  <ul className="mt-2 border-t border-hair">
                    {warnings.map((w) => (
                      <li key={w.id} className="flex items-center gap-3 border-b border-hair py-3">
                        <span className={`size-2.5 shrink-0 rounded-full ${w.level === "stop" ? "bg-alarm" : "bg-ink-soft"}`} />
                        <span className="min-w-0 flex-1 text-[17px] leading-snug font-semibold">{warningLabel(w)}</span>
                        {now > 0 && <span className="shrink-0 text-[14px] text-ink-soft tabular">{t.whenAgo(Math.max(0, Math.round((now - Date.parse(w.at)) / 60_000)))}</span>}
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
            </div>
          </details>
        </nav>
      </div>
    </ElderShell>
  );
}

/** One line of the home list: hairline between rows, a big target, an arrow or icon at the right. */
function ListRow({
  title,
  sub,
  icon: I,
  href,
  onClick,
  tone = "ink",
}: {
  title: string;
  sub?: string;
  icon: typeof Phone;
  href?: string;
  onClick?: () => void;
  tone?: "ink" | "alarm";
}) {
  const cls = `flex min-h-[72px] w-full items-center justify-between gap-4 border-b border-hair text-left transition active:bg-paper-2 ${tone === "alarm" ? "text-alarm" : "text-ink"}`;
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block text-[22px] leading-tight font-semibold">{title}</span>
        {sub && <span className="block text-[16px] font-normal text-ink-soft">{sub}</span>}
      </span>
      <I className="size-6 shrink-0" strokeWidth={1.8} />
    </>
  );
  if (href?.startsWith("tel:")) return <a href={href} className={cls}>{inner}</a>;
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Tile({ href, icon: I, title, sub }: { href: string; icon: typeof Users; title: string; sub?: string }) {
  return (
    <Link href={href} className="flex min-h-[104px] flex-col justify-between rounded-[18px] p-4 shadow-soft">
      <I className="size-6" strokeWidth={1.8} />
      <span>
        <span className="block text-[16px] leading-tight font-semibold">{title}</span>
        {sub && <span className="block text-[13px] text-ink-soft">{sub}</span>}
      </span>
    </Link>
  );
}
