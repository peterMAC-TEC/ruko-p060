import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SurveyBot } from "@/components/survey/SurveyBot";
import { labAllowed } from "@/lib/lab";
import { getTrialCall } from "@/lib/store";

export const metadata: Metadata = { title: "A few questions", robots: { index: false } };

// After a drill call the facilitator opens this for the older person (kind = participant) or the family member
// (kind = family): /survey/participant?call=<call id>. Only the facilitator can open it.
export default function CallSurvey({ params, searchParams }: PageProps<"/survey/[kind]">) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
      <Inner params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Inner({ params, searchParams }: Pick<PageProps<"/survey/[kind]">, "params" | "searchParams">) {
  const { kind } = await params;
  if (kind !== "participant" && kind !== "family") notFound();
  const { call, lang } = await searchParams;
  if (!(await labAllowed())) return <p className="p-10 text-[18px]">This survey is opened by the facilitator, from the call screen.</p>;
  const c = typeof call === "string" ? await getTrialCall(call) : undefined;
  if (!c) return <p className="p-10 text-[18px]">Open this from the call screen, so it knows which call it is for.</p>;
  return <SurveyBot kind={kind} callId={c.id} ctx={{ arm: c.arm, isScam: c.is_scam }} initialLang={lang === "hing" ? "hing" : "en"} />;
}
