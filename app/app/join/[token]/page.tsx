import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinInvite } from "@/components/account/JoinInvite";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Join Ruko Family" };

export default function JoinPage({ params }: PageProps<"/join/[token]">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Join params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function Join({ params }: Pick<PageProps<"/join/[token]">, "params">) {
  const { token } = await params;
  const viewer = await getViewer();
  return <JoinInvite token={token} signedIn={Boolean(viewer)} hasProfile={Boolean(viewer?.user)} />;
}
