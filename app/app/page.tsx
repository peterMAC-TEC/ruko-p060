import { ArrowRight, BellRing, Building2, Landmark, Mic, PhoneIncoming, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { ResetDemo } from "@/components/ResetDemo";
import { flags } from "@/lib/flags";

const how = [
  {
    icon: PhoneIncoming,
    title: "Spot the scam call",
    body: "A long call from an unknown number, a “CBI officer”, a “safe account”. Ruko notices, with consent.",
  },
  {
    icon: Users,
    title: "Bring in the family",
    body: "Priya’s phone rings: “Your mother may be on a scam call. Call her now.” A familiar voice breaks the spell.",
  },
  {
    icon: Landmark,
    title: "Pause the money",
    body: "The bank holds the transfer for 30 minutes and explains why, in plain words. The fraud desk sees every reason.",
  },
];

const parts = [
  {
    n: "01",
    icon: Mic,
    title: "Is this call real?",
    body: "Five calm questions, read aloud in English or Hindi. A clear verdict, and the family told if it is a scam.",
    who: "Elder",
    links: [
      { href: "/check", label: "Check a call" },
      { href: "/app", label: "Elder home" },
    ],
  },
  {
    n: "02",
    icon: BellRing,
    title: "Ruko Family",
    body: "Up to three people who accept their own invite, a trusted person for large payments, and a silent “Tell my family”.",
    who: "Elder + family",
    links: [
      { href: "/circle", label: "My family" },
      { href: "/family", label: "Family phone" },
    ],
  },
  {
    n: "03",
    icon: Building2,
    title: "Bank-side friction",
    body: "Risky payments pause, and the pause follows the person across UPI, cash and fixed deposits until family or the bank clears it.",
    who: "Elder + bank",
    links: [
      { href: "/bank", label: "Practice bank" },
      { href: "/console", label: "Fraud desk" },
    ],
  },
  {
    n: "04",
    icon: ShieldCheck,
    title: "Scam simulator & results",
    body: "Consented, role-played scam calls. The north star, measured.",
    who: "Researcher",
    links: [],
  },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-night text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <RukoWordmark tone="light" />
        <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-white/40">ForgeX 2.0 · P060</span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20 sm:pt-16">
        <h1 className="font-display text-[46px] leading-[1.02] sm:text-[84px]">
          <span className="text-white/35 line-through decoration-signal decoration-[3px]">
            &ldquo;This is the CBI. You are under digital arrest.&rdquo;
          </span>
          <br />
          Ruko.
        </h1>
        <p className="mt-7 max-w-2xl text-[19px] leading-relaxed text-white/70 sm:text-[21px]">
          Ruko means &ldquo;stop&rdquo;. It stops impersonation scams before money moves: it spots the call, brings in the
          family, and gives the bank a reason to pause.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/demo"
            className="group flex items-center gap-3 rounded-xl bg-white px-6 py-4 text-[17px] font-bold text-night transition hover:brightness-95"
          >
            Try the live demo
            <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
          </Link>
          <a href="#how" className="flex items-center rounded-xl border border-white/15 px-6 py-4 text-[17px] hover:border-white/40">
            How it works
          </a>
        </div>
        <p className="mt-4 text-[14px] text-white/40">One minute, five taps, three live screens.</p>
      </section>

      <section id="how" className="border-y border-white/8 bg-night-2">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/8 sm:grid-cols-3">
          {how.map((h, i) => (
            <div key={h.title} className="bg-night-2 p-8">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/6 text-white">
                  <h.icon className="size-5" />
                </span>
                <span className="font-mono text-[12px] text-white/35">0{i + 1}</span>
              </div>
              <h2 className="mt-6 text-[22px] font-bold">{h.title}</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-white/60">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-[40px] leading-tight">Four parts, one safety net.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {parts.map((p) => {
            const live = p.links.length > 0;
            return (
              <div key={p.n} className="flex flex-col rounded-2xl border border-white/8 bg-night-2 p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-white/6">
                    <p.icon className="size-5" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] ${
                      live ? "bg-mint/12 text-mint" : "bg-white/6 text-white/40"
                    }`}
                  >
                    {live ? "Live" : "In progress"}
                  </span>
                </div>
                <h3 className="mt-6 text-[24px] font-bold">{p.title}</h3>
                <p className="mt-1 text-white/60">{p.body}</p>
                <p className="mt-1 text-[13px] text-white/35">{p.who}</p>
                {live && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {p.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3.5 py-2 text-[14px] hover:border-white/40"
                      >
                        {l.label}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-[15px] text-white/50">
          <span>
            Scam call? Hang up and dial{" "}
            <a href="tel:1930" className="font-bold text-white">
              1930
            </a>{" "}
            or report at{" "}
            <a href="https://cybercrime.gov.in" className="underline underline-offset-4" target="_blank" rel="noreferrer">
              cybercrime.gov.in
            </a>
          </span>
          {flags.DEMO_MODE && <ResetDemo />}
        </div>
      </footer>
    </div>
  );
}
