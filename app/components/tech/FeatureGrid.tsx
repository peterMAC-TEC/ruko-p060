import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Chip } from "./TechBackdrop";

// Everything Ruko does, as cards a judge can open in any order. Each card says what part of the system it shows.

type Card = { href: string; title: string; body: string; tags: string[]; step?: string };

export const CARDS: Card[] = [
  { href: "/family", step: "2", title: "Family phone", body: "Priya's phone: the red alert in plain words, the code word, approve or say no.", tags: ["Front end", "Family circle"] },
  { href: "/bank", step: "3", title: "Mock bank", body: "A practice bank. Money Lock pauses a risky payment and asks the family first.", tags: ["Front end", "Money Lock"] },
  { href: "/console", step: "4", title: "Fraud desk", body: "What the bank team sees: held payments, Ruko Guard decisions, the evidence log.", tags: ["Back end", "Bank side"] },
  { href: "/line", title: "Ruko Line", body: "An unknown caller is graded, screened and put through, taken as a message, or blocked.", tags: ["Front end", "Code decides"] },
  { href: "/check", title: "Is this a scam?", body: "The guided check a real person uses. Five questions, one clear answer.", tags: ["Front end", "Code decides"] },
  { href: "/companion", title: "Talk to Ruko", body: "A calm voice for the next minute, when someone is on the line and scared.", tags: ["Front end", "AI words"] },
  { href: "/setup", title: "Set up Ruko for Mum or Dad", body: "Family-first setup: code word, trusted people, test alert, printable Rule Card.", tags: ["Front end", "Setup"] },
  { href: "/demo/call", title: "Watch it play", body: "The same scam as a short audio role-play, with and without Ruko.", tags: ["Recorded"] },
  { href: "/demo/guided", title: "Three phones, side by side", body: "The elder's phone, the family's phone and the bank's fraud desk on one screen, ticking through a scam.", tags: ["Front end", "Back end"] },
  { href: "/demo/how", step: "5", title: "Under the hood", body: "How a call moves through Ruko, and a live Ruko Guard box a bank would call.", tags: ["Back end", "Architecture"] },
  { href: "/results", title: "Results and trial lab", body: "The north-star number and how it is measured. Demo data is labelled; no field results yet.", tags: ["Back end", "Stats"] },
];

export function FeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c) => (
        <Link
          key={c.href}
          href={c.href}
          className="group relative flex min-h-[176px] flex-col rounded-[20px] border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-[#38e1ff]/50 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38e1ff]"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[22px] leading-tight font-semibold text-white">{c.title}</h3>
            <ArrowUpRight className="size-5 shrink-0 text-white/40 transition group-hover:text-[#38e1ff]" strokeWidth={1.8} />
          </div>
          <p className="mt-2 text-[16px] leading-snug text-white/65">{c.body}</p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
            {c.step && <Chip tone="cyan">Step {c.step}</Chip>}
            {c.tags.map((t) => (
              <Chip key={t} tone="grey">
                {t}
              </Chip>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}

/** The hero card: the live call. Big, lit, first. */
export function LiveCallCard() {
  return (
    <Link
      href="/demo/live"
      className="group relative block overflow-hidden rounded-[28px] border border-[#38e1ff]/40 bg-gradient-to-br from-[#0b2230] via-[#08141f] to-[#060a10] p-6 shadow-[0_0_80px_rgba(56,225,255,0.12)] transition hover:border-[#38e1ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#38e1ff] sm:p-8"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="red">
          <span className="size-2 rounded-full bg-[#ff4d3d] motion-safe:animate-pulse" /> Start here
        </Chip>
        <Chip tone="grey">Step 1</Chip>
        <Chip tone="grey">Voice in · voice out</Chip>
        <Chip tone="grey">Code decides · AI words</Chip>
      </div>
      <h2 className="mt-4 text-[36px] leading-[1.02] font-bold tracking-tight text-white sm:text-[48px]">Take a live scam call</h2>
      <p className="mt-3 max-w-2xl text-[20px] leading-relaxed text-white/75 sm:text-[22px]">
        A realistic scammer rings you. You play the older person: argue, doubt, refuse. He adapts. At the payment ask, Ruko steps in, and you choose how it ends.
      </p>
      <span className="mt-5 inline-flex min-h-[72px] items-center gap-3 rounded-[18px] bg-[#38e1ff] px-8 text-[24px] font-semibold text-[#041016] shadow-[0_0_40px_rgba(56,225,255,0.35)] transition group-hover:brightness-110">
        Take the call <ArrowUpRight className="size-6" strokeWidth={2} />
      </span>
      <p className="mt-4 font-mono text-[13px] tracking-wide text-white/45">ABOUT 3 MIN · MICROPHONE OPTIONAL · NOTHING RECORDED · NO REAL MONEY</p>
    </Link>
  );
}
