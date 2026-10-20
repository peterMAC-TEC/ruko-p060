import { promises as fs } from "fs";
import path from "path";
import type { TabBundle } from "../types";
import type { TabRepository } from "./types";

// Local JSON store: one file per tab in <repo>/data/tabs. For local dev and offline demos.
const DIR = process.env.STORE_DIR ?? path.resolve(process.cwd(), "..", "data", "tabs");

const fileFor = (tabId: string) => path.join(DIR, `${tabId}.json`);

// Serialise writes within this process so read-check-write is atomic.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

async function read(tabId: string): Promise<TabBundle | null> {
  try {
    return JSON.parse(await fs.readFile(fileFor(tabId), "utf8")) as TabBundle;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export const fileRepository: TabRepository = {
  get: read,
  async list() {
    const files = await fs.readdir(DIR).catch(() => [] as string[]);
    const tabs = await Promise.all(files.filter((f) => f.endsWith(".json")).map((f) => read(f.slice(0, -5))));
    return tabs.filter((t): t is TabBundle => t !== null);
  },
  put: (bundle, expectedVersion) =>
    serial(async () => {
      const current = await read(bundle.tab.id);
      if ((current?.version ?? null) !== expectedVersion) return false;
      await fs.mkdir(DIR, { recursive: true });
      const target = fileFor(bundle.tab.id);
      const tmp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(bundle, null, 2));
      await fs.rename(tmp, target);
      return true;
    }),
};
