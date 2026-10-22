import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LiveCall } from "@/components/demo/LiveCall";
import { elderForPage, trustedFor } from "@/lib/pages";

export const metadata: Metadata = { title: "Live call demo" };

export default function LiveDemoPage() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
        <Live />
      </Suspense>
    </div>
  );
}

async function Live() {
  const page = await elderForPage("1");
  if (!page) redirect("/login?next=/demo/live");
  const trusted = await trustedFor(page.elderId);
  return <LiveCall elderId={page.elderId} demo={page.demo} trusted={trusted} />;
}
