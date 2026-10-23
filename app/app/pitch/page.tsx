import type { Metadata } from "next";
import { PitchDeck } from "@/components/tech/PitchDeck";

export const metadata: Metadata = { title: "Pitch" };

export default function PitchPage() {
  return <PitchDeck />;
}
