import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { FALLBACK_LIBRARY, type DrillLibrary } from "./drill";

// Loads data/drill-scripts.json (read fresh, so edits to the scripts show up
// without a restart). Falls back to a minimal built-in library.

export async function loadDrillLibrary(): Promise<DrillLibrary> {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "drill-scripts.json"), "utf8");
    const lib = JSON.parse(raw) as DrillLibrary;
    if (Array.isArray(lib.scripts) && lib.scripts.some((s) => s.is_scam) && lib.scripts.some((s) => !s.is_scam)) return lib;
  } catch {
    // Missing or invalid: use the fallback.
  }
  return FALLBACK_LIBRARY;
}

export async function scriptIds() {
  const lib = await loadDrillLibrary();
  return {
    scams: lib.scripts.filter((s) => s.is_scam).map((s) => s.id),
    controls: lib.scripts.filter((s) => !s.is_scam).map((s) => s.id),
  };
}
