import "server-only";
import { hashCodeWord } from "./circle";
import { approvalGate } from "./code-word-rule";
import { getCircleCodeWordHash, getProtection } from "./store";

// Voice Trust: after a call Ruko has flagged (Money Lock is on), a trusted person can only APPROVE a payment by giving
// the family code word the elder set up in advance. Declining never needs it. If no code word was ever set, nothing
// changes (the existing approval flow stands), so this can only make a flagged payment harder to release.

/** Everything the approval route needs to know, in one lookup. */
export async function codeWordGate(elderId: string, decision: "approved" | "declined", supplied?: string) {
  const [protection, hash] = await Promise.all([getProtection(elderId), getCircleCodeWordHash(elderId)]);
  return approvalGate({
    decision,
    protectionActive: protection.active,
    codeWordSet: Boolean(hash),
    supplied,
    matches: Boolean(hash && supplied && hashCodeWord(elderId, supplied) === hash),
  });
}

/** Is the code word needed to approve this person's payments right now? */
export async function codeWordRequired(elderId: string): Promise<boolean> {
  const [protection, hash] = await Promise.all([getProtection(elderId), getCircleCodeWordHash(elderId)]);
  return Boolean(protection.active && hash);
}

export async function codeWordMatches(elderId: string, word: string): Promise<boolean> {
  const hash = await getCircleCodeWordHash(elderId);
  return Boolean(hash) && hashCodeWord(elderId, word) === hash;
}
