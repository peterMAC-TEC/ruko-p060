import { redirect } from "next/navigation";

// The results page is taken off the site (no field-trial results exist yet, and the live demo should not show a results
// dashboard). The full page is in git history (before 23 Oct) if it is needed again.
export default function ResultsPage() {
  redirect("/demo");
}
