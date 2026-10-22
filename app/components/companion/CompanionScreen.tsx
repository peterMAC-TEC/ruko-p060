"use client";

import { useRouter } from "next/navigation";
import { CompanionApp } from "./CompanionApp";

/** The Companion as its own page (from the home screen): waits for one tap so the voice is allowed to play. */
export function CompanionScreen({ elderId, trusted }: { elderId: string; trusted?: { name: string; phone: string } }) {
  const router = useRouter();
  return <CompanionApp elderId={elderId} trusted={trusted} autoStart={false} onClose={() => router.push("/app")} />;
}
