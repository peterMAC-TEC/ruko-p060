import type { Metadata } from "next";
import { Chip, TechBackdrop } from "@/components/tech/TechBackdrop";
import { UnderTheHood } from "@/components/tech/UnderTheHood";

export const metadata: Metadata = { title: "Under the hood" };

export default function HowPage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#060a10] text-white">
      <TechBackdrop glow="green" />
      <main className="relative mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <Chip tone="cyan">Front end to back end</Chip>
        <h1 className="mt-5 max-w-3xl text-[40px] leading-[1.04] font-bold tracking-tight sm:text-[68px]">Under the hood</h1>
        <p className="mt-4 max-w-2xl text-[20px] leading-relaxed text-white/70">How one scam call moves through Ruko, and the part a bank would plug into. Everything below is real code, not a mock-up.</p>
        <div className="mt-12">
          <UnderTheHood />
        </div>
      </main>
    </div>
  );
}
