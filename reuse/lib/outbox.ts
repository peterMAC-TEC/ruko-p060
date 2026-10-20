"use client";

// Outbox: every change the phone makes is queued, kept across reloads, and retried until the server
// confirms it. Bar Wi-Fi drops requests; a "Paid ✓" must never silently fail to save.
import { useSyncExternalStore } from "react";
import { markNotRight, markPayment, setLineAssignments, setRules, setTip, trackPayer } from "@/app/t/[tabId]/actions";
import { saveBill } from "@/app/t/[tabId]/bill/actions";
import { friendFeedback, friendOpened, friendPaid, friendPromise, friendTappedPay } from "@/app/t/[tabId]/p/[token]/actions";

const ACTIONS = {
  markPayment,
  setLineAssignments,
  setRules,
  setTip,
  trackPayer,
  markNotRight,
  saveBill,
  friendOpened,
  friendTappedPay,
  friendPaid,
  friendPromise,
  friendFeedback,
} as const;

type ActionName = keyof typeof ACTIONS;
type ArgsOf<N extends ActionName> = Parameters<(typeof ACTIONS)[N]>;

interface Job {
  id: string;
  name: ActionName;
  args: unknown[];
  /** Jobs with the same key replace each other (only the latest bill or line state matters). */
  key?: string;
  tries: number;
}

const STORE_KEY = "lastcall:outbox";
type Status = "idle" | "saving" | "offline";

let queue: Job[] = [];
let status: Status = "idle";
let running = false;
let loaded = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(queue));
  } catch {
    // Storage blocked: the queue still works for this page.
  }
}

function setStatus(next: Status) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    queue = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch {
    queue = [];
  }
  window.addEventListener("online", () => void flush());
  if (queue.length) void flush();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function flush() {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue[0];
    setStatus("saving");
    try {
      const fn = ACTIONS[job.name] as (...a: unknown[]) => Promise<{ ok: boolean }>;
      // A refused change (bad link, tab gone) won't succeed on retry either, so any answer counts as done.
      await fn(...job.args);
      queue.shift();
      persist();
    } catch {
      job.tries++;
      persist();
      setStatus("offline");
      await wait(Math.min(30_000, 1000 * 2 ** Math.min(job.tries, 5)));
    }
  }
  running = false;
  setStatus("idle");
  waiters.splice(0).forEach((w) => w());
}

const waiters: (() => void)[] = [];

/** Resolves once everything queued so far has reached the server (or after `timeoutMs`, to never trap the user). */
export function whenSaved(timeoutMs = 8000): Promise<void> {
  load();
  if (!queue.length && !running) return Promise.resolve();
  return new Promise((resolve) => {
    waiters.push(resolve);
    setTimeout(resolve, timeoutMs);
  });
}

/** Queue a server change. Returns immediately; the UI should already show the new state. */
export function send<N extends ActionName>(name: N, args: ArgsOf<N>, key?: string) {
  load();
  if (key) queue = queue.filter((j) => j.key !== key || j === queue[0]);
  queue.push({ id: Math.random().toString(36).slice(2), name, args: args as unknown[], key, tries: 0 });
  persist();
  void flush();
}

export function useSaveStatus(): Status {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => "idle",
  );
}
