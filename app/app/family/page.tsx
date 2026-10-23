import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FamilyApp } from "@/components/family/FamilyApp";
import { PhoneFrame } from "@/components/family/PhoneFrame";
import { memberForPage } from "@/lib/pages";

export const metadata: Metadata = { title: "Family alerts" };

export default function FamilyPage({ searchParams }: PageProps<"/family">) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#060a10]" />}>
      <Member searchParams={searchParams} />
    </Suspense>
  );
}

// A signed-in family member sees their own alerts; the guided demo (?embed=1)
// and signed-out visitors see Priya's demo phone. Embedded, the app is shown bare;
// on its own page it sits in a phone on the control-room stage.
async function Member({ searchParams }: Pick<PageProps<"/family">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await memberForPage(embed);
  if (!page) redirect("/login?next=/family");
  const framed = embed !== "1" && page.demo;
  const app = <FamilyApp memberId={page.memberId} elderIds={page.elderIds} embed={embed === "1"} demo={page.demo} framed={framed} />;
  if (!framed) return <div className="min-h-[100dvh] bg-[#f4f6f8]">{app}</div>;
  return <PhoneFrame>{app}</PhoneFrame>;
}
