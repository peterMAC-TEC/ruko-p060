import type { Metadata } from "next";
import { Suspense } from "react";
import { RunConsole } from "@/components/lab/RunConsole";
import { loadDrillLibrary } from "@/lib/drill-server";
import { labAllowed } from "@/lib/lab";
import { getTrialCall, listTrialCalls } from "@/lib/store";

export const metadata: Metadata = { title: "Run call" };

export default function RunPage({ params }: PageProps<"/lab/run/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-paper-2" />}>
      <Run params={params} />
    </Suspense>
  );
}

async function Run({ params }: Pick<PageProps<"/lab/run/[id]">, "params">) {
  if (!(await labAllowed())) return <p className="p-10">Facilitator only.</p>;
  const { id } = await params;
  const call = await getTrialCall(id);
  if (!call) return <p className="p-10">Call not found.</p>;
  const [lib, siblings] = await Promise.all([loadDrillLibrary(), listTrialCalls({ participantId: call.participant_id })]);
  const script = lib.scripts.find((s) => s.id === call.script_id);
  if (!script) return <p className="p-10">Script {call.script_id} is missing from data/drill-scripts.json.</p>;
  const next = siblings.find((c) => c.order_no === call.order_no + 1);
  return <RunConsole callId={id} script={script} nextCallId={next?.id ?? null} />;
}
