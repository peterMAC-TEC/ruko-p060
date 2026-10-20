import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Instrument_Serif, JetBrains_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible was designed for low-vision readers: the elder screens use it.
const atkinson = Atkinson_Hyperlegible({ variable: "--font-atkinson", subsets: ["latin"], weight: ["400", "700"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "600"] });
const serif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Ruko", template: "%s · Ruko" },
  description: "Stop digital-arrest scams before money moves.",
  applicationName: "Ruko",
};

export const viewport: Viewport = {
  themeColor: "#0f5e5a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${atkinson.variable} ${devanagari.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
