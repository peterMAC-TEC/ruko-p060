// The demo's offline switch (set on the /demo hub): when "1", the live call uses scripted and recorded lines only.
export const OFFLINE_KEY = "ruko:demo-offline";

/** True when the presenter has switched offline mode on. Safe to call anywhere; false if storage is blocked. */
export function demoOffline(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(OFFLINE_KEY) === "1";
  } catch {
    return false;
  }
}
