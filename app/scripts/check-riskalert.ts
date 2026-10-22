// The family alert for a risky number: what may travel, who gets told, how often, and the offline queue.
// Run: npx tsx scripts/check-riskalert.ts
import assert from "node:assert/strict";
import { enqueue, flush, load, MAX_QUEUED, type Store } from "../lib/alert-queue";
import { alertMessage, AlertBody, cleanReasonCodes, elderNotice, HOUR_MS, MAX_PER_HOUR, numberKey, REASON_CODES, SAME_NUMBER_MS, shouldAlert, throttle } from "../lib/risk-alert";

let n = 0;
const ok = (name: string, cond: boolean) => {
  assert.ok(cond, name);
  n++;
  console.log(`ok  ${name}`);
};
const H = "a".repeat(64);
const good = { elderId: "e1", riskLevel: "red", reasonCodes: ["international", "reported_many"], numberHash: H, source: "android" };

// What may travel
ok("a valid alert is accepted", AlertBody.safeParse(good).success);
ok("audio or a transcript cannot be added (the shape is strict)", !AlertBody.safeParse({ ...good, transcript: "hello" }).success && !AlertBody.safeParse({ ...good, audio: "AAAA" }).success && !AlertBody.safeParse({ ...good, said: "x" }).success);
ok("a raw phone number is refused: only a hash is allowed", !AlertBody.safeParse({ ...good, numberHash: "+919845000001" }).success);
ok("an unknown source is refused", !AlertBody.safeParse({ ...good, source: "voice" }).success);
ok("reason codes outside the list are dropped", cleanReasonCodes(["international", "a secret", "reported_many", "international"]).join() === "international,reported_many");
ok("every reason code has a plain-words label", REASON_CODES.every((c) => cleanReasonCodes([c]).length === 1));
ok("no alert message contains a number or a quote", (["red", "orange"] as const).every((l) => !/\d{4}|["“]/.test(alertMessage("Kamala", l))));

// Who is told
ok("only orange and red tell the family", shouldAlert("red") && shouldAlert("orange") && !shouldAlert("yellow") && !shouldAlert("green"));
ok("the elder is always told when family is told", /Priya/.test(elderNotice("Priya")) && /your family/.test(elderNotice(null)));

// How often
const now = 10_000_000;
ok("the first alert goes", throttle([], now, "abc").allow);
ok("the same number again within 10 minutes is held back", !throttle([{ at: now - 5 * 60_000, numberKey: "abc" }], now, "abc").allow);
ok("the same number after 10 minutes goes again", throttle([{ at: now - SAME_NUMBER_MS - 1, numberKey: "abc" }], now, "abc").allow);
ok("a different number is not held back by the first", throttle([{ at: now - 60_000, numberKey: "abc" }], now, "xyz").allow);
ok("six alerts an hour is the most", !throttle(Array.from({ length: MAX_PER_HOUR }, (_, i) => ({ at: now - i * 60_000, numberKey: `n${i}` })), now, "new").allow);
ok("alerts older than an hour do not count", throttle(Array.from({ length: MAX_PER_HOUR }, (_, i) => ({ at: now - HOUR_MS - i * 1000, numberKey: `n${i}` })), now, "new").allow);
ok("a number is keyed by a short hash prefix, never the number", numberKey(H) === "a".repeat(12) && numberKey(undefined) === null);

// The offline queue
function fakeStore(): Store & { raw: string } {
  const s = { raw: "[]", get: () => s.raw, set: (v: string) => void (s.raw = v) };
  return s;
}

async function main() {
  const s = fakeStore();
  enqueue(s, good, now);
  enqueue(s, good, now);
  ok("an alert waits offline, and the same one is not queued twice", load(s, now).length === 1);
  const q = fakeStore();
  for (let i = 0; i < 30; i++) enqueue(q, { ...good, i }, now);
  ok("the queue is capped", load(q, now).length === MAX_QUEUED);
  ok("an old waiting alert expires", load(s, now + 31 * 60_000).length === 0);
  ok("nothing is lost if sending still fails", (await flush(s, async () => false, now)) === 0 && load(s, now).length === 1);
  ok("it goes out when the connection is back, and the queue empties", (await flush(s, async () => true, now)) === 1 && load(s, now).length === 0);
  const t = fakeStore();
  enqueue(t, good, now);
  ok("a send that throws is kept, not lost", (await flush(t, async () => { throw new Error("offline"); }, now)) === 0 && load(t, now).length === 1);
  ok("the queue holds codes only", !/transcript|audio/.test(JSON.stringify(load(t, now))));
  console.log(`all ${n} risk-alert checks passed`);
}
void main();
