"use client";

import { ChevronLeft, Languages } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { HelplineBar } from "@/components/elder/HelplineBar";
import type { Strings } from "@/lib/i18n";

// Shared building blocks for every elder screen, so they all feel like one
// calm, premium product: large type, one clear action, thumb-reachable buttons.

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

export function ElderShell({
  t,
  brand,
  onToggleLang,
  children,
  action,
}: {
  t: Strings;
  brand: ReactNode;
  onToggleLang: () => void;
  children: ReactNode;
  /** Pinned to the bottom of the screen, where thumbs reach. */
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-[20px] leading-relaxed text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-paper/90 px-5 pt-4 pb-3 backdrop-blur">
        {brand}
        <button
          onClick={onToggleLang}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[17px] font-bold shadow-soft"
        >
          <Languages className="size-[18px] text-calm" strokeWidth={2.2} />
          {t.language}
        </button>
      </header>
      <main className="flex flex-1 flex-col px-5 pt-2 pb-6">{children}</main>
      {action && (
        <div className="sticky bottom-0 z-20 border-t border-ink/5 bg-paper/95 px-5 pt-3 pb-4 backdrop-blur">{action}</div>
      )}
      <HelplineBar t={t} />
    </div>
  );
}

const looks = {
  primary: "bg-ink text-white disabled:bg-ink/25",
  brand: "bg-calm text-white disabled:bg-calm/30",
  danger: "bg-alarm text-white disabled:bg-alarm/40",
  secondary: "border-2 border-ink/12 bg-white text-ink disabled:opacity-40",
} as const;

export function BigButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  icon: I,
  href,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: keyof typeof looks;
  icon?: Icon;
  href?: string;
  className?: string;
}) {
  const cls = `flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-5 text-[21px] font-bold transition active:scale-[0.99] ${looks[variant]} ${className}`;
  const inner = (
    <>
      {I && <I className="size-6 shrink-0" strokeWidth={2.2} />}
      <span>{children}</span>
    </>
  );
  return href ? (
    <a href={href} onClick={onClick} className={cls}>
      {inner}
    </a>
  ) : (
    <button onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

export function BackLink({ t, onBack }: { t: Strings; onBack: () => void }) {
  return (
    <button onClick={onBack} className="-ml-2 flex min-h-12 items-center gap-1 self-start pr-3 text-[18px] font-bold text-calm">
      <ChevronLeft className="size-6" strokeWidth={2.4} />
      {t.back}
    </button>
  );
}

/** "Step 2 of 3" as dots, so the elder always knows how far along they are. */
export function StepDots({ step, of }: { step: number; of: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step} of ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i < step ? "w-7 bg-calm" : "w-3 bg-ink/15"}`} />
      ))}
    </div>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      <h1 className="text-[30px] font-bold leading-[1.15] tracking-tight">{children}</h1>
      {sub && <p className="mt-2 text-[18px] text-ink-soft">{sub}</p>}
    </div>
  );
}

const PALETTE = ["bg-calm text-white", "bg-gold-soft text-warn", "bg-calm-soft text-calm", "bg-paper-2 text-ink"];

export function Avatar({ name, size = "size-12" }: { name: string; size?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const tone = PALETTE[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full text-[17px] font-bold ${tone}`} aria-hidden>
      {initials || "?"}
    </span>
  );
}

export function Field({
  label,
  value,
  onChange,
  inputMode,
  autoFocus,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "text" | "tel" | "numeric";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[17px] font-bold text-ink-soft">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoFocus={autoFocus}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-2 min-h-16 w-full rounded-2xl border-2 border-transparent bg-white px-5 text-[22px] shadow-soft outline-none transition placeholder:text-ink/25 focus:border-calm"
      />
    </label>
  );
}
