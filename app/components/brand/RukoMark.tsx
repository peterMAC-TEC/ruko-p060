// The Ruko mark: a shield with a single bar across it, a hand held up to say "stop".
export function RukoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M16 2.5 4.5 6.8v8.4c0 7.1 4.8 12.4 11.5 14.3 6.7-1.9 11.5-7.2 11.5-14.3V6.8L16 2.5Z"
        fill="currentColor"
      />
      <rect x="10" y="14" width="12" height="3.2" rx="1.6" fill="white" />
    </svg>
  );
}

export function RukoWordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${tone === "dark" ? "text-calm" : "text-white"}`}>
      <RukoMark className="size-7" />
      <span className={`text-[22px] font-bold tracking-tight ${tone === "dark" ? "text-ink" : "text-white"}`}>Ruko</span>
    </span>
  );
}
