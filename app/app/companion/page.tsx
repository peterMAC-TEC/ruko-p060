import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CompanionScreen } from "@/components/companion/CompanionScreen";
import { elderForPage, trustedFor } from "@/lib/pages";

export const metadata: Metadata = { title: "Talk to Ruko" };

export default function CompanionPage({ searchParams }: PageProps<"/companion">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
        <Companion searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Companion({ searchParams }: Pick<PageProps<"/companion">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/companion");
  return <CompanionScreen elderId={page.elderId} trusted={await trustedFor(page.elderId)} />;
}
