import type { Metadata } from "next";
import { SharePoster } from "@/components/survey/SharePoster";

export const metadata: Metadata = { title: "Survey QR code", robots: { index: false } };

// A printable QR poster for the open survey: stick it up, or show it on a phone for people to scan.
export default function Share() {
  return <SharePoster />;
}
