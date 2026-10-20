import type { ButtonHTMLAttributes, ReactNode } from "react";
import { APP_NAME } from "@/lib/config";
import { SaveStatus } from "./save-status";

/** The bottom-third zone that holds a screen's one primary action. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 mt-auto flex flex-col gap-3 bg-gradient-to-t from-bg via-bg to-transparent pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export const buttonLook = (variant: "primary" | "secondary" = "primary") =>
  `grid min-h-14 w-full place-items-center rounded-2xl px-5 text-center text-lg font-semibold transition disabled:opacity-40 ${
    variant === "primary"
      ? "bg-neon text-neon-ink shadow-[0_0_32px_-6px] shadow-neon/60 active:scale-[0.98]"
      : "border border-edge bg-surface text-ink active:bg-raised"
  }`;

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${buttonLook(variant)} ${className}`} {...props} />;
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-edge px-2.5 py-0.5 text-xs font-medium text-muted">{children}</span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 mb-3 text-sm font-semibold tracking-widest text-muted uppercase">{children}</h2>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold tracking-[0.3em] text-neon uppercase">{children}</p>;
}

/** A big on/off pill: 48px tall, the label says what "on" means. */
export function TogglePill({ on, onChange, children }: { on: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`min-h-12 rounded-xl border px-3.5 text-sm font-semibold transition ${
        on ? "border-neon bg-neon/15 text-neon" : "border-edge bg-raised text-muted"
      }`}
    >
      {children}
    </button>
  );
}

const AVATAR_COLORS = ["#c6ff3d", "#ff7ad9", "#5ee7ff", "#ffb347", "#b69cff", "#7dffb0", "#ff8a7a", "#ffe66d"];

/** Initial in a coloured circle, so people find themselves by colour as well as name. */
export function Avatar({ name, index, size = "md" }: { name: string; index: number; size?: "md" | "lg" }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-bold text-black ${size === "lg" ? "size-14 text-2xl" : "size-10 text-lg"}`}
      style={{ background: color }}
      aria-hidden
    >
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

/** The small "Last Call · venue" line and a back link at the top of payer screens. */
export function TopBar({ venue, backHref, backLabel = "Back" }: { venue: string; backHref?: string; backLabel?: string }) {
  return (
    <div className="flex items-center justify-between pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Eyebrow>
        {APP_NAME} <span className="text-muted">· {venue || "new tab"}</span>
      </Eyebrow>
      <span className="flex items-center gap-2">
        <SaveStatus />
        {backHref && (
          <a href={backHref} className="min-h-11 content-center px-2 text-sm text-muted underline underline-offset-4">
            {backLabel}
          </a>
        )}
      </span>
    </div>
  );
}
