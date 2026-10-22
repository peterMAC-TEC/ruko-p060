import { ArrowLeft, Clock, HandCoins, Lock, ShieldAlert, Siren, ThumbsDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { impactSummary } from "@/lib/metrics";
import { loadPatternLibrary } from "@/lib/store";

export const metadata: Metadata = { title: "Impact" };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// Ruko's impact (v2 §5), from anonymous events only: no names, numbers or
// recordings. Demo-sandbox events are included only in DEMO_MODE and labelled.

export default function ImpactPage({ searchParams }: PageProps<"/impact">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2 text-ink">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <header className="flex items-center justify-between gap-3">
          <RukoWordmark />
          <Link href="/" className="flex min-h-11 items-center gap-1 text-[16px] font-bold text-calm">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </header>
        <Suspense fallback={<p className="mt-10 text-ink-soft">Loading…</p>}>
          <Impact searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Impact({ searchParams }: Pick<PageProps<"/impact">, "searchParams">) {
  const { days: raw } = await searchParams;
  await connection(); // live numbers, computed per request
  const days = [7, 30, 90].includes(Number(raw)) ? Number(raw) : 30;
  const [s, lib] = await Promise.all([impactSummary(days), loadPatternLibrary()]);
  const name = (id: string) => lib.patterns.find((p) => p.id === id)?.name.en ?? id;
  const maxFlag = Math.max(1, ...s.byPattern.map((p) => p.flagged));

  const cards = [
    { icon: HandCoins, label: "Money saved", value: inr(s.moneySaved), sub: `${s.paymentsAbandoned} payments not made after a warning`, tone: "emerald-card text-white" },
    { icon: ShieldAlert, label: "STOP warnings shown", value: s.stopShown, sub: `${s.scamsFlagged} calls flagged as scams` },
    { icon: Lock, label: "Money Lock holds", value: s.moneyLockTriggers, sub: "Payments paused for family or bank" },
    {
      icon: Clock,
      label: "Time to warning (median)",
      value: s.medianMsToWarning === null ? "—" : `${s.medianMsToWarning} ms`,
      sub: "From the last answer to STOP on screen",
    },
    {
      icon: ThumbsDown,
      label: "False alarm rate",
      value: s.falsePositiveRate === null ? "—" : `${Math.round(s.falsePositiveRate * 100)}%`,
      sub: `${s.falsePositives} of ${s.confirmedScams + s.falsePositives} warnings people rated`,
    },
    { icon: Siren, label: "“I've been scammed” opened", value: s.emergencyOpened, sub: "People who needed the golden-hour steps" },
  ];

  return (
    <main className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[40px] leading-[1.05]">Ruko&rsquo;s impact</h1>
          <p className="mt-1 text-[17px] text-ink-soft">Anonymous counts only. No names, phone numbers or recordings are kept for these numbers.</p>
        </div>
        <nav className="flex gap-1 rounded-full bg-white p-1 shadow-soft" aria-label="Period">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/impact?days=${d}`}
              className={`rounded-full px-4 py-2 text-[15px] font-bold ${d === days ? "bg-ink text-white" : "text-ink-soft"}`}
            >
              {d} days
            </Link>
          ))}
        </nav>
      </div>

      {s.includesDemo && (
        <p className="mt-4 inline-block rounded-full bg-paper-2 px-3 py-1 text-[14px] font-semibold text-ink-soft">
          Includes demo-sandbox and seeded data (DEMO_MODE). Real trial numbers are reported separately.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ icon: I, label, value, sub, tone }) => (
          <section key={label} className={`rounded-[24px] p-5 shadow-soft ${tone ?? "bg-white"}`}>
            <I className={`size-6 ${tone ? "text-white" : "text-calm"}`} strokeWidth={2.2} />
            <p className={`mt-3 text-[15px] font-bold ${tone ? "text-white/80" : "text-ink-soft"}`}>{label}</p>
            <p className="mt-1 text-[34px] leading-none font-bold tabular">{value}</p>
            <p className={`mt-2 text-[15px] ${tone ? "text-white/80" : "text-ink-soft"}`}>{sub}</p>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-[24px] bg-white p-5 shadow-soft">
        <h2 className="text-[20px] font-bold">Scams flagged, by type</h2>
        {s.byPattern.length === 0 ? (
          <p className="mt-2 text-ink-soft">No scams flagged in this period yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {s.byPattern.map((p) => (
              <li key={p.patternId} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-[16px] font-bold">{name(p.patternId)}</span>
                <span className="text-[16px] font-bold tabular">{p.flagged}</span>
                <span className="col-span-2 h-2.5 overflow-hidden rounded-full bg-paper-2">
                  <span className="block h-full rounded-full bg-calm" style={{ width: `${(p.flagged / maxFlag) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[14px] text-ink-soft">
        &ldquo;Money saved&rdquo; is the total of payments people decided not to make after Ruko warned them. Pattern library v{lib.version}.
      </p>
    </main>
  );
}
