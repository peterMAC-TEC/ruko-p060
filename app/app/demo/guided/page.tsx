import type { Metadata } from "next";
import { GuidedDemo } from "@/components/demo/GuidedDemo";
import { DEMO_ELDER_ID, DEMO_FAMILY_ID } from "@/lib/seed";

export const metadata: Metadata = { title: "Guided demo" };

export default function DemoPage() {
  return <GuidedDemo elderId={DEMO_ELDER_ID} familyId={DEMO_FAMILY_ID} />;
}
