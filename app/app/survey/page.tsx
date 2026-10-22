import type { Metadata } from "next";
import { SurveyBot } from "@/components/survey/SurveyBot";

export const metadata: Metadata = {
  title: "A few questions about phone scams",
  description: "A 3-minute anonymous survey by Ruko, a student project that helps older people stop phone scams.",
  robots: { index: false },
};

// The open survey: anyone with the link or QR code. Anonymous.
export default function OpenSurvey() {
  return <SurveyBot kind="open" />;
}
