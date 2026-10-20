import type { Metadata } from "next";
import { HelpApp } from "@/components/help/HelpApp";

export const metadata: Metadata = { title: "I've been scammed" };

// Open to everyone, signed in or not: someone who has just lost money should
// never meet a login screen.
export default function HelpPage() {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <HelpApp />
      </div>
    </div>
  );
}
