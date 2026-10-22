import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BankApp, type Prefill } from "@/components/bank/BankApp";
import { SignalPanel } from "@/components/bank/SignalPanel";
import { flags } from "@/lib/flags";
import { elderForPage } from "@/lib/pages";
import { getUser, listCircle } from "@/lib/store";
import { isTrialAccountId } from "@/lib/trial";
import { PracticeHomeButton } from "@/components/lab/PracticePhone";

export const metadata: Metadata = { title: "Practice bank" };

// The guided demo (/demo) opens this page in a phone frame with
// ?embed=1 (no signal panel; the guide drives the call) and, at the payment
// step, ?prefill=scam so the judge only has to tap Send.
const PREFILLS: Record<string, Prefill> = {
  scam: { name: "RBI Safe Account", account: "rbi.verify@axis", amount: 480000 },
  // The live call demo (/demo/live): the officer asked for fifty thousand rupees to a "government verification account".
  live: { name: "Government Verification Account", account: "govt.verification@okdemo", amount: 50000, shortPause: true },
};

export default function BankPage({ searchParams }: PageProps<"/bank">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <Suspense fallback={<div className="mx-auto min-h-[100dvh] max-w-md bg-paper" />}>
        <Bank searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Bank({ searchParams }: Pick<PageProps<"/bank">, "searchParams">) {
  const { embed, prefill } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/bank");
  const [{ members }, elder] = await Promise.all([listCircle(page.elderId), getUser(page.elderId)]);
  // The "Call … first" button rings the trusted person, or else the first family member.
  const first = members.find((m) => m.trusted) ?? members[0];
  const preset = page.demo && typeof prefill === "string" ? PREFILLS[prefill] : undefined;
  return (
    <>
      <div className="mx-auto max-w-md shadow-xl">
        <BankApp
          key={preset ? "prefill" : "home"}
          elderId={page.elderId}
          familyName={first?.name.split(" ")[0] ?? "family"}
          familyPhone={first?.phone ?? ""}
          prefill={preset}
          rukoOn={elder?.ruko_enabled !== false}
        />
      </div>
      {isTrialAccountId(page.elderId) && <PracticeHomeButton />}
      {flags.MOCK_SIGNALS && page.demo && embed !== "1" && (
        <div className="fixed top-20 right-4 z-50 w-72">
          <SignalPanel elderId={page.elderId} />
        </div>
      )}
    </>
  );
}
