import type { Metadata } from "next";
import { Suspense } from "react";
import { CallerScreen } from "@/components/lab/CallerScreen";
import { loadDrillLibrary } from "@/lib/drill-server";
import { labAllowed } from "@/lib/lab";
import { getTrialCall } from "@/lib/store";

export const metadata: Metadata = { title: "Call" };

export default function CallerPage({ params }: PageProps<"/lab/caller/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-night" />}>
      <Caller params={params} />
    </Suspense>
  );
}

async function Caller({ params }: Pick<PageProps<"/lab/caller/[id]">, "params">) {
  if (!(await labAllowed())) return <p className="p-10">Facilitator only.</p>;
  const { id } = await params;
  const [call, lib] = await Promise.all([getTrialCall(id), loadDrillLibrary()]);
  const script = call && lib.scripts.find((s) => s.id === call.script_id);
  if (!call || !script) return <p className="p-10">This call or its script wasn&apos;t found.</p>;
  return <CallerScreen callId={id} script={script} seed={call.order_no + call.participant_id.charCodeAt(0)} />;
}
