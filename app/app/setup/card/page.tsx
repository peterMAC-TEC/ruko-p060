import type { Metadata } from "next";
import { Suspense } from "react";
import { PrintButton } from "@/components/setup/PrintButton";
import { memberForPage, trustedFor } from "@/lib/pages";
import { ruleCard } from "@/lib/rule-card";

export const metadata: Metadata = { title: "Ruko Rule Card" };

export default function CardPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
      <Card />
    </Suspense>
  );
}

// A large card to print and stick by the phone. One sentence, a person to call, and the helpline.
async function Card() {
  const page = await memberForPage("1");
  const elderId = page?.elderIds[0];
  const trusted = elderId ? await trustedFor(elderId) : undefined;
  const first = trusted?.name.split(" ")[0] ?? null;
  const en = ruleCard(first, "en");
  const hing = ruleCard(first, "hing");
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-8 py-10 text-ink print:py-4">
      <p className="text-[18px] font-semibold tracking-[0.18em] text-ink-soft uppercase">Ruko Rule Card</p>
      <h1 className="display mt-4 text-[64px] leading-[1.02] print:text-[56px]">{en.rule}</h1>
      <p className="mt-8 text-[30px] leading-snug text-ink-soft">{hing.rule}</p>
      {trusted && (
        <p className="mt-10 rounded-[18px] border-2 border-ink p-6 text-[36px] leading-tight">
          Call {first}: <b className="tabular">{trusted.phone}</b>
        </p>
      )}
      <p className="mt-6 text-[28px]">
        Cyber fraud helpline: <b>1930</b> · cybercrime.gov.in
      </p>
      <PrintButton />
    </main>
  );
}
