# Reuse kit (copied from the Last Call prototype)

Proven pieces to adapt, not to import as-is. Each was built and tested for Last Call (an AI bill splitter for people out at night). Its "drunk-proof" design rules carry straight over to "elder-proof": huge targets, one action per screen, no typing, plain words, undo everything.

## Code

| File | What it is | Adapt for Ruko |
| --- | --- | --- |
| `lib/ai/provider.ts`, `gemini.ts`, `index.ts` | One `AiProvider` interface; Gemini implementation with JSON-schema replies validated by zod, one retry, and **hedging** (start a backup model after 12 s or on error, first answer wins) | Use as-is |
| `lib/ai/vision-task-example.ts` | A vision task (reads a bill photo into structured facts; the AI copies numbers, code computes) | Pattern for reading a scammer's "arrest warrant", ID card or message screenshot |
| `lib/ai/voice-task-example.ts` | Voice understanding: transcript **or audio clip** → facts constrained to known ids (zod enums), Hinglish guidance | Pattern for "tell me what's happening" → scam signs |
| `lib/voice/hold-to-talk.ts` | Hold to talk: browser speech recognition (`en-IN`; set `hi-IN` for Hindi) with live words; falls back to recording a clip (`ogg`/`mp4`/`webm`) for the AI | Use as-is; consider a tap-to-talk variant for elders |
| `lib/voice/local-match.ts` | Offline word matcher used when the AI is down | Pattern for an offline scam-phrase checker |
| `components/voice.tsx` | `HoldToTalk` button + `VoiceHeard` ("You said …" with highlighted matches, Use this / Not quite) | Reuse |
| `lib/outbox.ts` | Queue of server-action calls kept in localStorage and retried until saved; `whenSaved()` | Replace the action registry with Ruko's actions |
| `lib/store/*` | Repository with a local JSON-file store and a Supabase store (one JSON document per record, optimistic version check) via `lc_*` database functions secured by a server secret (the connected Supabase tool gives publishable keys only) | Rename the document type; keep the pattern |
| `docs/supabase-schema.sql` | The SQL for that pattern (RLS on, no policies, SECURITY DEFINER functions checking a SHA-256 of `SUPABASE_RPC_SECRET`) | Adapt names |
| `lib/events.ts` | Anonymous usage events stored with each record → a private `/stats` page | Use for the north star ("stopped before transferring") |
| `lib/image.ts` | Shrink photos in the browser to ~1600 px JPEG before upload (Vercel limit 4.5 MB) | Use as-is |
| `components/ui.tsx`, `save-status.tsx`, `submit-button.tsx`, `upi-qr.tsx` (generic QR) | Big buttons, action bar, toggles, "Saving… / Saved ✓" | Restyle |
| `config/*` | Next.js 16 config (Cache Components **off**), Vitest config (aliases `server-only`), tsconfig (target ES2020), dark theme CSS | Starting point |

## Lessons learned (save yourself the time)

- **Gemini on the free tier:** `gemini-3.5-flash` with `GEMINI_THINKING_LEVEL=LOW` answered in 4–9 s; `gemini-3.8-flash` and `gemini-flash-latest` took 60–90 s; `gemini-2.5-flash` is closed to new users. Backup model: `gemini-3.1-flash-lite`. The free tier sometimes returns 503 "high demand", which is why hedging exists. Settings are in `../.env.local.seed` (move them into `app/.env.local`; never commit).
- **Gemini audio:** accepts `audio/ogg`, `audio/webm` and `audio/mp4` inline; all three were tested with text-to-speech clips.
- **Next.js 16.4:** read `node_modules/next/dist/docs/` before writing routes; `PageProps<"/route">` and `RouteContext<"/route">` are global helpers; run `npx next typegen` after adding routes so `tsc` is happy.
- **Windows shell:** long Bash heredocs containing quotes sometimes fail to parse; write files with the Write tool instead. `npm` scripts run under cmd (no `VAR=x cmd`).
- **Browser APIs:** Chrome now exposes unprefixed `SpeechRecognition`. A count-up animation must have a timeout fallback (animation frames stop in hidden tabs). `useSearchParams`-style reads are simplest from `window.location` inside effects.
- **Deploy:** the Vercel CLI on this computer is logged in (`npx vercel@latest`); push env vars by piping values from `.env.local` so secrets never appear in chat. Supabase project creation in this org costs $0 but needs a cost-confirmation call.
- **India specifics:** commercial SMS needs DLT registration, so prefer WhatsApp links (`https://wa.me/?text=`), `tel:` links (e.g. the 1930 cyber-fraud helpline) and in-app alerts.
