// Presenter mode: the whole app on this laptop, with no internet and no AI.
// In-memory demo data (Kamala, Priya, the fraud desk), the phone's own phrase
// check instead of the AI. Phones on the same Wi-Fi open http://<laptop IP>:3300.
// Run: npm run demo:offline
import { spawn } from "node:child_process";

const win = process.platform === "win32";
const child = spawn(win ? "npx.cmd" : "npx", ["next", "dev", "-H", "0.0.0.0", "-p", "3300"], {
  stdio: "inherit",
  shell: win,
  env: { ...process.env, RUKO_OFFLINE: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
