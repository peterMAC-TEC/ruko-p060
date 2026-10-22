"use client";

import { Check, Copy, ExternalLink, Landmark, Phone, Share2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { BigButton, ElderShell } from "@/components/elder/ui";
import { track, usePatternLibrary } from "@/lib/client";
import { useLang } from "@/lib/i18n";

// "I've been scammed" (v2 §5): the golden-hour steps, the words to say to the
// bank, and a report the person can hand to police, bank or family. Nothing on
// this screen is sent anywhere unless the person shares it themselves.

const STEP_LINKS: { href: string | null; external: boolean }[] = [
  { href: "tel:1930", external: false },
  { href: null, external: false },
  { href: "https://cybercrime.gov.in", external: true },
  { href: "https://sancharsaathi.gov.in/sfc/", external: true },
  { href: null, external: false },
];

const METHODS = ["upi", "bank", "card", "cash", "otp", "other"] as const;

export function HelpApp() {
  const { t, toggle, lang } = useLang();
  const lib = usePatternLibrary();
  const [form, setForm] = useState({ number: "", when: "", amount: "", method: "upi", txn: "", type: "" });
  const [copied, setCopied] = useState(false);

  useEffect(() => track("emergency_opened"), []);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const scamName = lib.patterns.find((p) => p.id === form.type)?.name[lang];

  const report = [
    t.reportHeading,
    form.number && `${t.fNumber}: ${form.number}`,
    form.when && `${t.fWhen}: ${form.when.replace("T", " ")}`,
    form.amount && `${t.fAmount}: ${form.amount}`,
    `${t.fMethod}: ${t.methods[form.method]}`,
    form.txn && `${t.fTxn}: ${form.txn}`,
    scamName && `${t.fType}: ${scamName}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const share = async () => {
    if (typeof navigator.share === "function") {
      // A cancelled share is fine; the person chose not to.
      await navigator.share({ text: report }).catch(() => {});
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(report)}`, "_blank", "noopener");
  };

  return (
    <ElderShell
      t={t}
      brand={<RukoWordmark />}
      onToggleLang={toggle}
      action={
        <BigButton variant="danger" icon={Phone} href="tel:1930">
          {t.call1930Now}
        </BigButton>
      }
    >
      <div className="flex flex-col gap-5 animate-in fade-in duration-300">
        <div>
          <h1 className="display text-[42px] leading-[1.04]">{t.helpTitle}</h1>
          <p className="mt-2 text-[18px] text-ink-soft">{t.helpSub}</p>
        </div>

        <ol className="flex flex-col gap-3">
          {t.helpSteps.map((s, i) => {
            const link = STEP_LINKS[i];
            return (
              <li key={s.title} className="rounded-3xl bg-white p-5 shadow-soft">
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-alarm-soft text-[19px] font-bold text-alarm tabular">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[21px] leading-tight font-bold">{s.title}</h2>
                    <p className="mt-1 text-[17px] text-ink-soft">{s.body}</p>
                    {i === 1 && (
                      <div className="mt-3 rounded-2xl bg-paper p-4">
                        <p className="flex items-center gap-2 text-[15px] font-bold text-ink-soft">
                          <Landmark className="size-4" />
                          {t.bankScriptTitle}
                        </p>
                        <p className="mt-1 text-[18px] font-bold">{t.bankScript}</p>
                      </div>
                    )}
                    {link?.href && (
                      <a
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noreferrer" : undefined}
                        className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-ink/12 px-4 text-[17px] font-bold"
                      >
                        {link.external ? <ExternalLink className="size-4" /> : <Phone className="size-4" />}
                        {link.external ? link.href.replace(/^https:\/\//, "").replace(/\/.*$/, "") : t.call1930Now}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="flex gap-3 rounded-2xl bg-warn-soft p-4 text-[17px] font-bold text-warn">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.4} />
          {t.recoveryWarning}
        </p>

        <section className="rounded-3xl bg-white p-5 shadow-soft">
          <h2 className="text-[22px] font-bold">{t.reportTitle}</h2>
          <p className="mt-1 text-[16px] text-ink-soft">{t.reportSub}</p>
          <div className="mt-4 flex flex-col gap-3">
            <Input label={t.fNumber} value={form.number} onChange={set("number")} inputMode="tel" />
            <Input label={t.fWhen} value={form.when} onChange={set("when")} type="datetime-local" />
            <Input label={t.fAmount} value={form.amount} onChange={set("amount")} inputMode="numeric" />
            <Select label={t.fMethod} value={form.method} onChange={set("method")}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {t.methods[m]}
                </option>
              ))}
            </Select>
            <Input label={t.fTxn} value={form.txn} onChange={set("txn")} />
            <Select label={t.fType} value={form.type} onChange={set("type")}>
              <option value="">—</option>
              {lib.patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name[lang]}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={copy} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ink/12 text-[18px] font-bold">
              {copied ? <Check className="size-5 text-calm" /> : <Copy className="size-5" />}
              {copied ? t.copied : t.copyReport}
            </button>
            <button onClick={share} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink text-[18px] font-bold text-white">
              <Share2 className="size-5" />
              {t.shareReport}
            </button>
          </div>
        </section>

        <p className="text-[17px] text-ink-soft">{t.notAlone}</p>
        <Link href="/app" className="self-start text-[17px] font-bold text-calm underline underline-offset-4">
          {t.back}
        </Link>
      </div>
    </ElderShell>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "tel" | "numeric";
}) {
  return (
    <label className="block">
      <span className="text-[16px] font-bold text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-paper px-4 text-[19px] outline-none focus:border-calm"
      />
    </label>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[16px] font-bold text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-paper px-3 text-[19px]"
      >
        {children}
      </select>
    </label>
  );
}
