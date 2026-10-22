# Ruko (P060)

This folder is the Ruko app (hackathon problem P060) and nothing else.

## Where things are (merged 20 Oct)

- The app is the Ruko build copied from `C:\dev\hackathon-main` (8–10 Oct), plus the new pieces from this folder's first session. Its detailed build notes and rules are in [app/CLAUDE.md](app/CLAUDE.md); read it before changing code.
- Documents: [docs/](docs/), with [docs/DECISIONS.md](docs/DECISIONS.md) as the source of truth, [docs/FIELD-TEST.md](docs/FIELD-TEST.md) for the 10-elder protocol, and [README.md](README.md) for the demo script.
- Dev server: `npm --prefix app run dev -- -p 3200` (or the "ruko" launch config). Presenter mode: `npm --prefix app run demo:offline`. Tests: `npm --prefix app test`.
- `C:\dev\hackathon-main` is the old copy: don't change it.

## Scope rules

- Keep every file for this app inside this folder: code in `app/`, data in `data/`, documents in `docs/`.
- `reuse/` holds pieces copied from the Last Call prototype with the user's permission; adapt them. Do not read or change the other projects in `claud 2` (including Drunken Hackathon / Last Call) unless the user explicitly asks.
- Never commit `.env.local` or `.env.local.seed` (they hold the user's Gemini key).

## The problem card (P060, Mythic tier, track: Money: fintech, insurance and cross-border)

**"This is the CBI. You are under digital arrest."**

- **Problem:** Scammers impersonating police, customs or courier firms keep victims on video calls for hours and push them to transfer savings. Retirees and professionals alike lose life savings before their families find out.
- **Who experiences it:** Older adults and their families, and bank fraud teams.
- **Challenge:** Help people and families stop impersonation scams before money moves.
- **Build expectation:** Test the intervention with ten older adults and their families using role-played scams.
- **North star metric:** Share of role-played scam calls where the person stops before transferring.
- **Constraints:** Privacy and consent, no call interception without permission, and false alarms.
- **Why it matters:** Reported cyber fraud losses in India run into thousands of crores a year, and the Prime Minister warned the public about digital arrest scams in 2024. Banks and insurers want ways to stop transfers in the moment.
- **Directions (examples):** a family safety circle that prompts a check with someone in real time; call-pattern signals shared with consent; bank-side friction on unusual transfers.
- **Suggested tech:** Voice: Sarvam AI, Deepgram or Whisper, ElevenLabs, Vapi or Retell, Exotel or Twilio. Mobile: Progressive web app, Expo (React Native), MSG91 or Twilio SMS.

## Working with the user

- The user is not a developer: explain setup steps one at a time, keep reports short and plain, and say what works and what doesn't.
- Show the plan (and anything that changes the brief) before building; then build milestone by milestone, run tests and the app, commit.
- Log judgement calls in `docs/DECISIONS.md`.
