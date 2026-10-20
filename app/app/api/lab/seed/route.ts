import { labAllowed, labDenied, seedIllustrativeTrial } from "@/lib/lab";
import { deleteSeededTrial } from "@/lib/store";

// Illustrative (seeded) trial data: fictional D01–D10, always labelled.
export async function POST() {
  if (!(await labAllowed())) return labDenied();
  await seedIllustrativeTrial();
  return Response.json({ ok: true });
}

export async function DELETE() {
  if (!(await labAllowed())) return labDenied();
  await deleteSeededTrial();
  return Response.json({ ok: true });
}
