import { Atkinson_Hyperlegible_Next, Big_Shoulders, Martian_Mono, Tiro_Devanagari_Hindi } from "next/font/google";

// The deck's fonts, self-hosted by next/font at build time, so the deck needs no network when presented.
const head = Big_Shoulders({ variable: "--f-head", subsets: ["latin"], weight: "variable", axes: ["opsz"] });
const body = Atkinson_Hyperlegible_Next({ variable: "--f-body", subsets: ["latin"], weight: "variable" });
const mono = Martian_Mono({ variable: "--f-mono", subsets: ["latin"], weight: "variable" });
const hindi = Tiro_Devanagari_Hindi({ variable: "--f-hindi", subsets: ["devanagari"], weight: "400" });

export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${head.variable} ${body.variable} ${mono.variable} ${hindi.variable}`}>{children}</div>;
}
