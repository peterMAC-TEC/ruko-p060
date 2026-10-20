// Anonymous usage events, stored with each tab, for the prototype's stats page.
// Never put names, phone numbers or UPI IDs in event data.
import type { TabBundle, TabEvent } from "./types";

const MAX_EVENTS = 400;

export function track(bundle: TabBundle, type: string, data?: TabEvent["data"], at = new Date()) {
  const events = bundle.events ?? [];
  events.push({ at: at.toISOString(), type, ...(data ? { data } : {}) });
  bundle.events = events.slice(-MAX_EVENTS);
}

export const firstEvent = (bundle: TabBundle, type: string) => bundle.events?.find((e) => e.type === type);
export const lastEvent = (bundle: TabBundle, type: string) => bundle.events?.findLast((e) => e.type === type);
