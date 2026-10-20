import { BUNDLED_LIBRARY } from "@/lib/patterns";
import { loadPatternLibrary } from "@/lib/store";

// The live scam pattern library. Devices cache it for offline use and refresh
// it when the version changes, so new scams reach everyone without an app update.
export async function GET() {
  try {
    const lib = await loadPatternLibrary();
    return Response.json(lib, { headers: { "cache-control": "public, max-age=300" } });
  } catch {
    // If the database is unreachable, the bundled copy still protects people.
    return Response.json(BUNDLED_LIBRARY);
  }
}
