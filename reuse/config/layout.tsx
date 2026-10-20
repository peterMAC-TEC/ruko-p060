import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Neonderthaw } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only for the neon-sign logo.
const neon = Neonderthaw({
  variable: "--font-neon",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
  metadataBase: new URL(process.env.APP_URL || "https://last-call-sandy.vercel.app"),
  openGraph: { title: APP_NAME, description: APP_TAGLINE, siteName: APP_NAME, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geistSans.variable} ${geistMono.variable} ${neon.variable} antialiased`}>
      <body className="min-h-dvh">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">{children}</div>
      </body>
    </html>
  );
}
