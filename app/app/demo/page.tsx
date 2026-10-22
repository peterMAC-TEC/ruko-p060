import type { Metadata } from "next";
import { DemoHub } from "@/components/demo/DemoHub";

export const metadata: Metadata = { title: "Ruko demo" };

export default function DemoPage() {
  return <DemoHub />;
}
