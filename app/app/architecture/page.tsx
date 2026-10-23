import type { Metadata } from "next";
import { ArchitectureView } from "@/components/xray/ArchitectureView";

export const metadata: Metadata = { title: "Architecture" };

export default function ArchitecturePage() {
  return (
    <div
      className="min-h-[100dvh] bg-[#061529] text-white"
      style={{ backgroundImage: "linear-gradient(rgba(91,157,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(91,157,255,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
    >
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6">
        <p className="font-mono text-[13px] tracking-[0.16em] text-[#5b9dff] uppercase">Architecture · the judges&rsquo; five boxes</p>
        <h1 className="mt-3 text-[40px] leading-[1.02] font-bold tracking-tight sm:text-[68px]">
          AI reads and words. <span className="text-[#FFB000]">Code decides.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-[19px] leading-relaxed text-white/75">
          Frontend (input) → Backend (logic) → Services (AI, database, tools) → Backend prepares the result (checks, formats) → Frontend displays. Every box below names the real file that does the job.
        </p>
        <div className="mt-10">
          <ArchitectureView />
        </div>
      </main>
    </div>
  );
}
