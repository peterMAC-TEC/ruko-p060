import { loadDrillLibrary } from "@/lib/drill-server";
import { labAllowed, labDenied } from "@/lib/lab";

export async function GET() {
  if (!(await labAllowed())) return labDenied();
  return Response.json(await loadDrillLibrary());
}
