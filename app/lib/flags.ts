// Feature flags. Everything defaults to the safe, offline demo setup, so the
// app runs with no keys and the demo never depends on a carrier.
const on = (v: string | undefined, fallback: boolean) =>
  v === undefined || v === "" ? fallback : v === "true" || v === "1";

export const flags = {
  /** Seeded data, deterministic scripts, in-memory store when Supabase isn't configured. */
  DEMO_MODE: on(process.env.DEMO_MODE, true),
  /** SMS and phone calls are logged instead of sent. */
  MOCK_TELEPHONY: on(process.env.MOCK_TELEPHONY, true),
  /** Call-state signals come from the on-screen signal panel instead of the phone. */
  MOCK_SIGNALS: on(process.env.MOCK_SIGNALS, true),
  /** Presenter mode (`npm run demo:offline`): in-memory demo data and no AI, so nothing depends on the network. */
  OFFLINE: on(process.env.RUKO_OFFLINE, false),
};

export const hasSupabase =
  !on(process.env.RUKO_OFFLINE, false) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
