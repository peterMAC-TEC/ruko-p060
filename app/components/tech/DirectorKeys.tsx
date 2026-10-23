"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Director mode: keyboard shortcuts for the presenter, on every page.
//   1 home · 2 live call · 3 architecture · 4 family phone · 5 mock bank · 6 eval
//   R reset the demo · F reduce motion on/off · ? show the keys
// (X opens the X-Ray inside the call.) Ignored while typing in a box.

const GO: Record<string, string> = { "1": "/", "2": "/demo/live", "3": "/architecture", "4": "/family", "5": "/bank", "6": "/eval" };

export function DirectorKeys() {
  const router = useRouter();
  const path = usePathname() ?? "";
  // The deck has its own keys.
  const off = path.startsWith("/deck");
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const say = (t: string) => {
      setToast(t);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(""), 1800);
    };
    const k = (e: KeyboardEvent) => {
      if (off) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (GO[e.key]) {
        router.push(GO[e.key]);
        return;
      }
      if (e.key === "r" || e.key === "R") {
        say("Resetting the demo…");
        fetch("/api/demo/reset", { method: "POST" })
          .then((r) => say(r.ok ? "Demo reset" : "Could not reset"))
          .catch(() => say("Could not reset"));
      } else if (e.key === "f" || e.key === "F") {
        const reduce = document.documentElement.dataset.motion !== "reduce";
        if (reduce) document.documentElement.dataset.motion = "reduce";
        else delete document.documentElement.dataset.motion;
        try {
          localStorage.setItem("ruko-motion", reduce ? "reduce" : "full");
        } catch {
          // Fine.
        }
        window.dispatchEvent(new Event("ruko-motion"));
        say(reduce ? "Motion: off" : "Motion: on");
      } else if (e.key === "?") setHelp((h) => !h);
    };
    window.addEventListener("keydown", k);
    return () => {
      window.removeEventListener("keydown", k);
      clearTimeout(timer);
    };
  }, [router, off]);
  return (
    <>
      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[#14122B] px-5 py-2.5 font-mono text-[14px] text-white shadow-lg">
          {toast}
        </div>
      )}
      {help && (
        <div role="dialog" aria-label="Presenter keys" className="fixed right-4 bottom-4 z-[80] rounded-[16px] bg-[#14122B] p-5 font-mono text-[14px] leading-7 text-white shadow-lg">
          1 home · 2 live call · 3 architecture
          <br />4 family phone · 5 mock bank · 6 eval
          <br />X X-Ray (in the call) · R reset · F motion · ? close
        </div>
      )}
    </>
  );
}
