import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SetupApp } from "@/components/setup/SetupApp";
import { memberForPage } from "@/lib/pages";
import { getUser } from "@/lib/store";

export const metadata: Metadata = { title: "Set up Ruko" };

export default function SetupPage() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
        <Setup />
      </Suspense>
    </div>
  );
}

async function Setup() {
  const page = await memberForPage("1");
  if (!page || page.elderIds.length === 0) redirect("/login?next=/setup");
  const elderId = page.elderIds[0];
  const elder = await getUser(elderId);
  return <SetupApp elderId={elderId} memberId={page.memberId} elderFirst={elder?.name.split(" ")[0] ?? "Mum or Dad"} />;
}
