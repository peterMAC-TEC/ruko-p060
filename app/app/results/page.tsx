import type { Metadata } from "next";
import { Suspense } from "react";
import { ResultsDashboard } from "@/components/lab/ResultsDashboard";
import { labAllowed } from "@/lib/lab";

export const metadata: Metadata = { title: "Pilot results" };

export default function ResultsPage({ searchParams }: PageProps<"/results">) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-paper-2" />}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/results">, "searchParams">) {
  if (!(await labAllowed())) return <p className="p-10 text-[18px]">The pilot results are for the research team.</p>;
  const { data } = await searchParams;
  return <ResultsDashboard initial={data === "seeded" ? "seeded" : "real"} />;
}
