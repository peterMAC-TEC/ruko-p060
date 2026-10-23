import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Newsreader, Noto_Sans_Devanagari, Public_Sans } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { TechNav } from "@/components/tech/TechNav";
import { DirectorKeys } from "@/components/tech/DirectorKeys";

// Ink: Public Sans (clear, neutral, easy to read at large sizes) for the interface, Newsreader for the big, light display words.
const publicSans = Public_Sans({ variable: "--font-public", subsets: ["latin"], weight: ["400", "600", "800"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "600"] });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Ruko", template: "%s · Ruko" },
  description: "Stop digital-arrest scams before money moves.",
  applicationName: "Ruko",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${devanagari.variable} ${newsreader.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TechNav />
        {children}
        <SiteChrome />
        <DirectorKeys />
      </body>
    </html>
  );
}
