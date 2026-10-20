import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { PracticePhone } from "@/components/lab/PracticePhone";
import { PRACTICE_COOKIE } from "@/lib/pages";
import { isTrialAccountId } from "@/lib/trial";

export const metadata: Metadata = { title: "Phone" };

// The trial participant's practice phone home screen (set up by /lab/device/[id]).
export default function PhonePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-night" />}>
      <PhoneHome />
    </Suspense>
  );
}

async function PhoneHome() {
  const account = (await cookies()).get(PRACTICE_COOKIE)?.value;
  if (!account || !isTrialAccountId(account)) {
    return <p className="p-10 text-[18px]">This phone isn&apos;t set up for a practice session. Open the participant&apos;s phone link from the trial lab.</p>;
  }
  return <PracticePhone accountId={account} />;
}
