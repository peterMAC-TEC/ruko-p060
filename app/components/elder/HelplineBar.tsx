import { Phone } from "lucide-react";
import type { Strings } from "@/lib/i18n";

// Shown on every elder screen.
export function HelplineBar({ t }: { t: Strings }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-ink/8 bg-white px-5 py-3 text-[16px] text-ink-soft">
      <a href="tel:1930" className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-full bg-alarm-soft text-alarm">
          <Phone className="size-[18px]" strokeWidth={2.4} />
        </span>
        <span className="leading-tight">
          <span className="block text-[19px] font-bold tracking-wide text-ink tabular">1930</span>
          <span className="block text-[14px]">{t.helpline}</span>
        </span>
      </a>
      <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-[15px] underline underline-offset-4">
        cybercrime.gov.in
      </a>
    </div>
  );
}
