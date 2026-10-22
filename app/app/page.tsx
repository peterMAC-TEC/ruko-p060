import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ResetDemo } from "@/components/ResetDemo";
import { Chip, TechBackdrop } from "@/components/tech/TechBackdrop";
import { FeatureGrid, LiveCallCard } from "@/components/tech/FeatureGrid";
import { flags } from "@/lib/flags";

// The front door for judges: the live scam call first, then every other part of Ruko as a card, in any order.
// Calm, large-type elder screens live elsewhere (/check, /companion, /family ...); this page is the control room.

const STACK = ["Voice in", "Rules decide", "AI only words", "Family alert", "Money Lock", "Bank guard"];

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#060a10] text-white">
      <TechBackdrop />
      <main className="relative mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="green">
            <span className="size-2 rounded-full bg-[#4ade80] motion-safe:animate-pulse" /> Demo mode
          </Chip>
          <Chip tone="grey">ForgeX 2.0 · P060</Chip>
          <Chip tone="grey">No real money · nothing recorded</Chip>
        </div>
        <h1 className="m-rise mt-6 max-w-4xl text-[40px] leading-[1.02] font-bold tracking-tight sm:text-[60px]">
          Stop the scam call <span className="text-[#38e1ff]">before the money moves.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[18px] leading-relaxed text-white/70 sm:text-[20px]">
          Scammers pose as police and keep older people on a call until they pay. Ruko listens for the pressure, steps in with one word, and brings the family in.
        </p>

        <div className="mt-6">
          <LiveCallCard />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[13px] tracking-wide text-white/50 uppercase">
          {STACK.map((s, i) => (
            <span key={s} className="flex items-center gap-3">
              {s}
              {i < STACK.length - 1 && <ArrowRight className="size-3.5 text-[#38e1ff]/70" />}
            </span>
          ))}
        </div>

        <div className="mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">Explore Ruko</p>
            <h2 className="mt-1 text-[30px] font-bold tracking-tight sm:text-[40px]">Open anything, in any order</h2>
          </div>
          <Link href="/demo/how" className="hidden min-h-12 shrink-0 items-center rounded-full border border-white/20 px-5 text-[16px] font-semibold text-white/90 transition hover:border-[#38e1ff] hover:text-[#38e1ff] sm:flex">
            See how it works under the hood
          </Link>
        </div>
        <div className="mt-5">
          <FeatureGrid />
        </div>
        <Link href="/demo/how" className="mt-4 flex min-h-14 items-center justify-center rounded-[16px] border border-white/20 text-[17px] font-semibold sm:hidden">
          See how it works under the hood
        </Link>

        <section className="mt-14 grid gap-6 rounded-[24px] border border-[#ff4d3d]/30 bg-[#ff4d3d]/[0.06] p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <p className="font-mono text-[13px] tracking-[0.14em] text-[#ff8a7d] uppercase">If money has already moved</p>
            <a href="tel:1930" className="mt-1 block text-[88px] leading-none font-bold tracking-tight sm:text-[120px]">
              1930
            </a>
            <p className="mt-1 text-[18px] text-white/75">The cyber fraud helpline. Call within the first hour if you can.</p>
          </div>
          <div className="flex flex-col justify-end gap-3">
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-[30px] font-semibold underline underline-offset-8">
              cybercrime.gov.in
            </a>
            <Link href="/help" className="flex min-h-[64px] items-center justify-center rounded-[16px] bg-white text-[20px] font-semibold text-[#060a10]">
              I think I have been scammed
            </Link>
          </div>
        </section>

        {flags.DEMO_MODE && (
          <div className="mt-8 text-white/70">
            <ResetDemo />
          </div>
        )}
      </main>
    </div>
  );
}
