import type { Metadata } from "next";
import { CallDemo } from "@/components/demo/CallDemo";

export const metadata: Metadata = { title: "Watch Ruko step in" };

export default function CallDemoPage() {
  return (
    <div className="min-h-[100dvh] bg-white">
      <CallDemo />
    </div>
  );
}
