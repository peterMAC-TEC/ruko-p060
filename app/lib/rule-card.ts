// The Rule Card: ONE sentence in plain words, the elder's home-screen headline and a printable card. It always names a person.
export type RuleLang = "en" | "hing";

export function ruleCard(trustedFirstName: string | null | undefined, lang: RuleLang = "en") {
  const who = (trustedFirstName ?? "").trim();
  if (!who) {
    return lang === "en"
      ? { rule: "If anyone asks for money on a call, hang up and call 1930. Never stay on the line.", name: null }
      : { rule: "Agar koi call par paise maange, call kaat dijiye aur 1930 par phone kijiye. Line par kabhi mat rahiye.", name: null };
  }
  return lang === "en"
    ? { rule: `If anyone asks for money on a call, hang up and call ${who}. Never stay on the line.`, name: who }
    : { rule: `Agar koi call par paise maange, call kaat dijiye aur ${who} ko phone kijiye. Line par kabhi mat rahiye.`, name: who };
}
