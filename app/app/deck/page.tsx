import type { Metadata } from "next";
import { Deck } from "@/components/deck/Deck";

export const metadata: Metadata = { title: "Pitch deck" };

export default function DeckPage() {
  return <Deck />;
}
