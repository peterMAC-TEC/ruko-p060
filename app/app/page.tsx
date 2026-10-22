import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LiveGuardian } from "@/components/brand/LiveGuardian";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { ResetDemo } from "@/components/ResetDemo";
import { flags } from "@/lib/flags";

// The front door. Warm and alive, because a visitor here is not in danger: that changes the moment they
// open "Is this a scam?". Red is not used on this page at all (it is kept for danger).

const steps = [
  { n: "1", title: "Notice the pressure", body: "Someone says you will be arrested. Someone says do not tell your family. Someone says pay now." },
  { n: "2", title: "Pause", body: "Real officers do not do this. You can put the phone down. Nothing bad happens in the next minute." },
  { n: "3", title: "Check it yourself", body: "Call back on a number you already know. Never on the number the caller gave you." },
  { n: "4", title: "Get support", body: "Call someone you trust. Ruko can tell your family for you, and stay with you." },
];

const doors = [
  { href: "/check", title: "Is this a scam?", body: "Five questions. A clear answer." },
  { href: "/companion", title: "Talk to Ruko", body: "A calm voice for the next minute." },
  { href: "/setup", title: "Set up Ruko for Mum or Dad", body: "Five small steps for the family, in about five minutes." },
  { href: "/circle", title: "My family circle", body: "The people who will hear first." },
  { href: "/bank", title: "Pause before you pay", body: "Practise a payment that stops to think." },
  { href: "/line", title: "Ruko Line", body: "Check who is calling before you answer." },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-white text-ink">

      <section className="relative overflow-hidden bg-ink text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <RukoWordmark tone="light" />
        <a href="tel:1930" className="flex min-h-12 items-center rounded-full border border-white/30 px-5 text-[17px] font-semibold">
          Help: 1930
        </a>
      </header>
        <div className="mx-auto max-w-6xl px-6 pt-6 pb-14 sm:pt-10 sm:pb-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-1.5 text-[15px] font-semibold tracking-[0.12em] text-white/80 uppercase">
            <span className="size-2 rounded-full bg-white/70" aria-hidden /> Demo mode
          </p>
          <h1 className="display m-rise mt-6 max-w-4xl text-[48px] leading-[0.98] sm:text-[84px]">
            Hear the call. <em className="italic">Then stop it.</em>
          </h1>
          <p className="mt-6 max-w-2xl text-[22px] leading-relaxed text-white/80 sm:text-[26px]">
            A realistic AI scammer will try to convince you to pay. See what Ruko does.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/demo/live"
              className="press group flex min-h-[88px] items-center justify-center gap-4 rounded-[22px] bg-white px-10 text-[28px] font-semibold text-ink shadow-[0_18px_60px_rgba(255,255,255,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:min-h-[104px] sm:text-[34px]"
            >
              Take a live scam call
              <ArrowRight className="size-8 transition group-hover:translate-x-1" strokeWidth={1.8} />
            </Link>
            <p className="max-w-[16rem] text-[17px] leading-snug text-white/65">About three minutes. You play the older person; use your voice. Nothing is recorded.</p>
          </div>
          <nav className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[19px]" aria-label="More">
            {[
              ["/check", "Is this a scam?"],
              ["/circle", "Family Circle"],
              ["/line", "Ruko Line"],
              ["/results", "Results"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="min-h-12 py-2 text-white/85 underline underline-offset-8 hover:text-white">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:grid-cols-[1.4fr_1fr] sm:py-20">
          <div>
            <h2 className="display text-[40px] leading-tight sm:text-[64px]">When someone pressures you, Ruko helps you <em className="italic">pause.</em></h2>
            <p className="mt-5 max-w-xl text-[21px] leading-relaxed text-ink-soft">
              Some callers pretend to be the police or a bank. They scare you, rush you and ask for money. Ruko helps you stop, check, and bring in someone you trust.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/check" className="press flex min-h-[72px] items-center justify-center gap-3 rounded-[18px] bg-ink px-8 text-[22px] font-semibold text-white">
                Help me check a call
                <ArrowRight className="size-6" strokeWidth={1.8} />
              </Link>
              <Link href="/companion" className="flex min-h-[72px] items-center justify-center rounded-[18px] border border-hair bg-white px-8 text-[22px] font-semibold">
                Talk to Ruko
              </Link>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <LiveGuardian className="size-52 sm:size-72" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="text-[17px] font-semibold tracking-[0.14em] text-ink-soft uppercase">Works with what you already have</p>
        <h2 className="display mt-3 max-w-4xl text-[40px] leading-[1.05] sm:text-[72px]">Your phone can spot the scam. Ruko stops the money.</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            ["Share anything to Ruko", "A strange message, a call transcript from your phone's own call screening: send it to Ruko in one tap, from any app."],
            ["Family hears first", "Someone you trust is told straight away, with what to say. A familiar voice breaks the spell."],
            ["Payments wait", "A risky payment pauses and asks a trusted person before any money can move."],
          ].map(([title, body]) => (
            <div key={title} className="border-t border-ink pt-4">
              <h3 className="text-[24px] font-semibold">{title}</h3>
              <p className="mt-2 text-[19px] leading-relaxed text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h2 className="display text-[40px] leading-tight sm:text-[64px]">How Ruko helps</h2>
        <ol className="mt-10 grid gap-0 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n} className="m-rise border-t border-ink py-6 sm:pr-6" style={{ animationDelay: `${i * 90}ms` }}>
              <span className="display text-[72px] leading-none">{s.n}</span>
              <h3 className="mt-3 text-[24px] font-semibold">{s.title}</h3>
              <p className="mt-2 text-[19px] leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
        <h2 className="display text-[40px] leading-tight sm:text-[56px]">Where would you like to start?</h2>
        <div className="mt-8 flex flex-col">
          {doors.map((d) => (
            <Link key={d.href} href={d.href} className="group flex min-h-[88px] items-center justify-between gap-4 border-b border-hair py-4">
              <span>
                <span className="display block text-[30px] leading-tight sm:text-[40px]">{d.title}</span>
                <span className="block text-[19px] text-ink-soft">{d.body}</span>
              </span>
              <ArrowRight className="size-7 shrink-0 transition group-hover:translate-x-1" strokeWidth={1.6} />
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 sm:py-20">
          <div>
            <p className="text-[17px] font-semibold tracking-[0.14em] uppercase text-white/60">If money has already moved</p>
            <a href="tel:1930" className="display mt-2 block text-[96px] leading-none sm:text-[140px]">
              1930
            </a>
            <p className="mt-2 text-[21px]">The cyber fraud helpline. Call within the first hour if you can.</p>
          </div>
          <div className="flex flex-col justify-end gap-4 text-[21px]">
            <p>Report online, any time:</p>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="display text-[40px] underline underline-offset-8">
              cybercrime.gov.in
            </a>
            <Link href="/help" className="mt-2 flex min-h-[64px] items-center justify-center rounded-[18px] bg-white text-[22px] font-semibold text-ink">
              I think I have been scammed
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8 text-[16px] text-ink-soft">
        <p className="font-semibold text-ink">ForgeX 2.0 · P060 · For the judges and the field test</p>
        <nav className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/demo/live" className="underline underline-offset-4">Live call</Link>
          <Link href="/demo/call" className="underline underline-offset-4">Call demo (audio)</Link>
          <Link href="/demo" className="underline underline-offset-4">Demo hub</Link>
          <Link href="/lab" className="underline underline-offset-4">Trial lab</Link>
          <Link href="/results" className="underline underline-offset-4">Results</Link>
          <Link href="/console" className="underline underline-offset-4">Fraud desk</Link>
          <Link href="/survey" className="underline underline-offset-4">Survey</Link>
          <Link href="/phone" className="underline underline-offset-4">Practice phone</Link>
        </nav>
        {flags.DEMO_MODE && (
          <div className="mt-4">
            <ResetDemo />
          </div>
        )}
      </footer>
    </div>
  );
}
