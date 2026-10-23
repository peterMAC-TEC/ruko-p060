import type { Metadata } from "next";
import { Presenter } from "@/components/deck/Presenter";

export const metadata: Metadata = { title: "Presenter view" };

export default function PresenterPage() {
  return <Presenter />;
}
