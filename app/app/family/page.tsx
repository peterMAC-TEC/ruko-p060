import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FamilyApp } from "@/components/family/FamilyApp";
import { memberForPage } from "@/lib/pages";

export const metadata: Metadata = { title: "Family alerts" };

export default function FamilyPage({ searchParams }: PageProps<"/family">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense>
          <Member searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

// A signed-in family member sees their own alerts; the guided demo (?embed=1)
// and signed-out visitors see Priya's demo phone.
async function Member({ searchParams }: Pick<PageProps<"/family">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await memberForPage(embed);
  if (!page) redirect("/login?next=/family");
  return <FamilyApp memberId={page.memberId} elderIds={page.elderIds} embed={embed === "1"} demo={page.demo} />;
}
