"use client";

import { CountUp } from "@/components/motion/motion";

// Why this matters: published figures, each with its source on screen. Checked 22 Oct 2026 against the sources named.
// Only figures that could be confirmed are here. "AI will make these scams rise again" is our assumption, supported by the deepfake trend figures but not a measured Indian trend.

export const FACTS: Array<{ big: string; count?: { prefix?: string; to: number; suffix?: string }; text: string; source: string; href: string }> = [
  {
    big: "21.8 lakh complaints",
    text: "of financial cyber fraud in India in 2025, up from 19.2 lakh in 2024, with about ₹19,813 crore reported lost (₹22,849 crore in 2024).",
    source: "I4C / National Cyber Crime Reporting Portal data, reported by The420.in, 3 Jan 2026",
    href: "https://the420.in/india-cyber-fraud-losses-i4c-data-statewise-investment-scams/",
  },
  {
    big: "1,03,488 complaints",
    count: { to: 103488, suffix: " complaints" },
    text: "of financial cyber fraud from senior citizens in 2025, with losses of about ₹4,005 crore.",
    source: "Ministry of Home Affairs written reply in the Rajya Sabha (via Asianet Newsable)",
    href: "https://newsable.asianetnews.com/india/senior-citizens-women-lost-rs-7-769-crore-to-cyber-fraud-in-2025-articleshow-u9oad8w",
  },
  {
    big: "21,900+ in 2026",
    text: "digital-arrest complaints from January to August 2026 (₹647 crore lost), after 1,23,672 in 2024 (₹1,935 crore) and 58,239 in 2025 (₹1,211 crore).",
    source: "I4C and MHA status report to the Supreme Court, reported by Free Press Journal, 23 Oct 2026",
    href: "https://www.freepressjournal.in/tech/digital-arrest-fraud-over-21900-complaints-involving-647-crore-registered-in-2026-centre-tells-supreme-court",
  },
  {
    big: "+1,300%",
    text: "rise in deepfake fraud attempts in 2024, and synthetic voice calls up 173% from the first to the last quarter of 2024.",
    source: "Pindrop Voice Intelligence & Security Report, 12 Jun 2025",
    href: "https://www.prnewswire.com/news-releases/pindrops-2025-voice-intelligence--security-report-reveals-1-300-surge-in-deepfake-fraud-302479482.html",
  },
  {
    big: "$40 billion",
    text: "projected generative-AI-enabled fraud losses in the US by 2027, up from $12.3 billion in 2023 (32% a year).",
    source: "Deloitte Center for Financial Services, 29 May 2024",
    href: "https://www.deloitte.com/us/en/insights/industry/financial-services/deepfake-banking-fraud-risk-on-the-rise.html",
  },
  {
    big: "47%",
    count: { to: 47, suffix: "%" },
    text: "of Indian adults in a 2023 survey had experienced an AI voice scam, or knew someone who had (20% themselves, 27% someone they know).",
    source: "McAfee, The Artificial Imposter, 2023 (1,010 Indian respondents)",
    href: "https://www.mcafee.com/en-in/consumer-corporate/newsroom/press-releases/2023/20231108.html",
  },
];

export function ProblemFacts() {
  return (
    <section className="mt-6 rounded-[24px] bg-white p-5 shadow-soft" aria-labelledby="facts-title">
      <h2 id="facts-title" className="text-[20px] font-bold">
        Why this matters
      </h2>
      <p className="mt-1 text-[15px] text-ink-soft">Published figures, with their sources. Not Ruko&rsquo;s results.</p>
      <dl className="mt-4 grid gap-5 sm:grid-cols-2">
        {FACTS.map((f) => (
          <div key={f.big} className="border-t border-hair pt-3">
            <dt className="display text-[34px] leading-none tabular">{f.count ? <CountUp to={f.count.to} prefix={f.count.prefix} suffix={f.count.suffix} /> : f.big}</dt>
            <dd className="mt-2 text-[17px] leading-snug">{f.text}</dd>
            <dd className="mt-1 text-[14px] text-ink-soft">
              Source:{" "}
              <a href={f.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                {f.source}
              </a>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 rounded-xl bg-paper-2 p-3 text-[15px] text-ink-soft">
        <b className="text-ink">Our hypothesis, not a measured trend:</b> AI voice cloning could make these scams rise again. This is why Ruko protects the moment the money moves, not the voice on the phone.
      </p>
      <p className="mt-3 text-[14px] text-ink-soft">No field-trial results exist yet. Nothing on this page is a measured outcome of Ruko.</p>
    </section>
  );
}
