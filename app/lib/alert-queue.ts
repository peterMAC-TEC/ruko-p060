// When the phone is offline, an alert waits here and goes out when the connection comes back. It holds codes only.
export interface QueuedAlert {
  body: Record<string, unknown>;
  at: number;
}
export interface Store {
  get: () => string | null;
  set: (v: string) => void;
}
export const MAX_QUEUED = 10;
export const MAX_AGE_MS = 30 * 60_000;

export function load(s: Store, now: number): QueuedAlert[] {
  try {
    const list = JSON.parse(s.get() ?? "[]") as QueuedAlert[];
    return list.filter((q) => now - q.at < MAX_AGE_MS).slice(-MAX_QUEUED);
  } catch {
    return [];
  }
}

export function enqueue(s: Store, body: Record<string, unknown>, now: number) {
  const list = load(s, now);
  const key = JSON.stringify(body);
  if (!list.some((q) => JSON.stringify(q.body) === key)) list.push({ body, at: now });
  s.set(JSON.stringify(list.slice(-MAX_QUEUED)));
}

/** Try each waiting alert; keep the ones that still fail. Returns how many went out. */
export async function flush(s: Store, send: (body: Record<string, unknown>) => Promise<boolean>, now: number): Promise<number> {
  const list = load(s, now);
  const left: QueuedAlert[] = [];
  let sent = 0;
  for (const q of list) {
    let ok = false;
    try {
      ok = await send(q.body);
    } catch {
      ok = false;
    }
    if (ok) sent++;
    else left.push(q);
  }
  s.set(JSON.stringify(left));
  return sent;
}
