import type { Metadata } from "next";
import { Suspense } from "react";
import { LabHome } from "@/components/lab/LabHome";
import { loadDrillLibrary } from "@/lib/drill-server";
import { labAllowed } from "@/lib/lab";

export const metadata: Metadata = { title: "Trial lab" };

export default function LabPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-paper-2" />}>
      <Lab />
    </Suspense>
  );
}

async function Lab() {
  if (!(await labAllowed())) {
    return <p className="p-10 text-[18px]">The trial lab is for the facilitator only. Sign in with a researcher account.</p>;
  }
  const lib = await loadDrillLibrary();
  return <LabHome titles={Object.fromEntries(lib.scripts.map((s) => [s.id, s.title_en]))} />;
}
