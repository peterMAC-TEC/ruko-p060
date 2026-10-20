import type { Metadata } from "next";
import { FraudConsole } from "@/components/console/FraudConsole";

export const metadata: Metadata = { title: "Fraud desk" };

export default function ConsolePage() {
  return <FraudConsole />;
}
