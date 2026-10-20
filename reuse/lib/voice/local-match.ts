// Offline fallback for voice: simple word matching for names, numbers (incl. Hinglish) and bill lines.
// Used when the AI is busy or unreachable. Results are always shown for confirmation, never applied silently.

const NUMBERS: Record<string, number> = {
  one: 1, ek: 1, a: 1, an: 1, two: 2, do: 2, couple: 2, three: 3, teen: 3, four: 4, char: 4, chaar: 4,
  five: 5, paanch: 5, panch: 5, six: 6, chhe: 6, che: 6,
};
const SHARED = new Set(["thoda", "thode", "thodi", "some", "bit", "share", "shared", "half"]);
const EVERYONE = new Set(["everyone", "everybody", "all", "sab", "sabne", "sabka", "sabhi"]);
const FILLER = new Set(["with", "naan", "premium", "pint", "fresh", "loaded", "veg", "the", "and", "aur"]);

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
const numberAt = (ws: string[], i: number) => {
  for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
    if (NUMBERS[ws[j]] !== undefined) return NUMBERS[ws[j]];
    if (/^\d+$/.test(ws[j])) return Number(ws[j]);
  }
  return null;
};
const sharedAt = (ws: string[], i: number) => ws.slice(Math.max(0, i - 2), i).some((w) => SHARED.has(w));
/** "kingfish" ~ "kingfisher", "nacho" ~ "nachos": same first 4+ letters. */
const close = (a: string, b: string) => a.length >= 4 && b.length >= 4 && (a.startsWith(b.slice(0, 5)) || b.startsWith(a.slice(0, 5)));

export interface LocalPerson {
  name: string;
  isVeg: boolean;
  noAlcohol: boolean;
  isBirthday: boolean;
}

/** "Rohan, Priya veg, Aman no alcohol aur Sneha veg and no alcohol" → people with switches. */
export function localPeople(transcript: string): LocalPerson[] {
  const chunks = transcript.split(/,|\band\b(?!\s+no\b)|\baur\b|\bplus\b|\./i).map((c) => c.trim()).filter(Boolean);
  const people: LocalPerson[] = [];
  for (const chunk of chunks) {
    const ws = words(chunk);
    const name = chunk.match(/[A-Za-z][A-Za-z'-]+/)?.[0];
    if (!name || ["veg", "no", "birthday", "and", "aur"].includes(name.toLowerCase())) {
      // "…Sneha veg and no alcohol": a trailing switch belongs to the previous person.
      const last = people.at(-1);
      if (last) Object.assign(last, flags(ws, last));
      continue;
    }
    people.push({ name: name[0].toUpperCase() + name.slice(1).toLowerCase(), ...flags(ws.slice(1)) });
  }
  return people;
}

function flags(ws: string[], base?: LocalPerson) {
  const text = ` ${ws.join(" ")} `;
  return {
    isVeg: (base?.isVeg ?? false) || (/\b(veg|vegetarian)\b/.test(text) && !/\bnon\s?veg\b/.test(text)),
    noAlcohol: (base?.noAlcohol ?? false) || /\b(no alcohol|doesnt drink|dont drink|not drinking|sober|driving|no drinks)\b/.test(text),
    isBirthday: (base?.isBirthday ?? false) || /\bbirthday\b/.test(text),
  };
}

/** Quick question: "Aman had it", "Sneha aur Priya ne ek ek liya", "sab ne share kiya". */
export function localCard(transcript: string, people: { id: string; name: string }[]) {
  const ws = words(transcript);
  if (ws.some((w) => EVERYONE.has(w))) return { everyone: true, people: [] as { personId: string; units: number }[] };
  const found: { personId: string; units: number }[] = [];
  people.forEach((p) => {
    const i = ws.findIndex((w) => w === p.name.toLowerCase() || close(w, p.name.toLowerCase()));
    if (i >= 0) found.push({ personId: p.id, units: numberAt(ws, i) ?? 1 });
  });
  return { everyone: false, people: found };
}

/** "Not right?": "do Kingfisher aur thode nachos" → 2 Kingfisher, a shared part of the nachos. */
export function localClaim(transcript: string, lines: { id: string; name: string }[]) {
  const ws = words(transcript);
  const items: { lineId: string; units: number; shared: boolean }[] = [];
  for (const line of lines) {
    const keys = words(line.name).filter((k) => k.length >= 4 && !FILLER.has(k));
    const i = ws.findIndex((w) => keys.some((k) => close(w, k)));
    if (i < 0) continue;
    const shared = sharedAt(ws, i);
    items.push({ lineId: line.id, units: shared ? 1 : (numberAt(ws, i) ?? 1), shared });
  }
  return items;
}
