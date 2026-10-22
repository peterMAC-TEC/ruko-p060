import { canActAsElder } from "@/lib/auth";
import { flags } from "@/lib/flags";
import { scoreNumber } from "@/lib/numberRisk";
import { hashNumber } from "@/lib/privacy";
import { summarizeNumberReports } from "@/lib/store";
import { observe } from "@/lib/threat-server";

// GET ?n=+91…&contact=1  the pre-call risk for a number. Returns only an
// aggregate (how risky, why, how many reports), never who reported it.
// With &elderId=… (the person's own check) a risky result also goes into
// their threat picture: it's the "contact" stage of the attack.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const n = url.searchParams.get("n")?.trim();
  if (!n || n.length < 3 || n.length > 20) return Response.json({ error: "Enter a phone number" }, { status: 400 });
  const reports = await summarizeNumberReports(hashNumber(n), flags.DEMO_MODE);
  const risk = scoreNumber(n, { inContacts: url.searchParams.get("contact") === "1", reports });

  const elderId = url.searchParams.get("elderId");
  if (elderId && risk.level !== "low" && (await canActAsElder(elderId)).ok) {
    await observe(elderId, [
      { tactic: "RT01", source: "number", lr: risk.level === "high" ? 8 : 3, evidence: `${risk.level}: ${risk.reasons.join(", ")}` },
    ]);
  }
  // The hash lets the web app send the family alert (a separate, CSRF-protected POST) without ever sending the number again.
  return Response.json({ ...risk, hash: hashNumber(n) });
}
