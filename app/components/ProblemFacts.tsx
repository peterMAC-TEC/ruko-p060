// Why this matters: published figures, each with its source on screen. Checked 22 Oct 2026 against the sources named.
// Only figures that could be confirmed are here. "AI could make scams rise again" is our hypothesis, not a measured trend.

const FACTS: Array<{ big: string; text: string; source: string; href: string }> = [
  {
    big: "₹22,845 crore",
    text: "lost to cyber fraud in India in 2024, up from ₹7,465 crore in 2023.",
    source: "Ministry of Home Affairs reply in Parliament, July 2025 (via Scroll)",
    href: "https://scroll.in/latest/1084796/indians-lost-rs-22845-crore-to-cyber-fraud-in-2024-a-206-rise-from-previous-year-centre",
  },
  {
    big: "1,03,488 complaints",
    text: "of financial cyber fraud from senior citizens in 2025, with losses of about ₹4,005 crore.",
    source: "Ministry of Home Affairs written reply in the Rajya Sabha (via Asianet Newsable)",
    href: "https://newsable.asianetnews.com/india/senior-citizens-women-lost-rs-7-769-crore-to-cyber-fraud-in-2025-articleshow-u9oad8w",
  },
  {
    big: "60,676 → 1,23,672",
    text: "digital-arrest cases reported in India, 2023 to 2024: about double in a year, with about ₹1,935 crore lost in 2024.",
    source: "Government reply in Parliament (via Outlook Money and Inc42)",
    href: "https://www.outlookmoney.com/banking/digital-arrests-and-cyber-crimes-under-watch-over-781-lakh-sim-cards-blocked-by-feb",
  },
  {
    big: "47%",
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
            <dt className="display text-[34px] leading-none tabular">{f.big}</dt>
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
