"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="mt-10 min-h-[64px] self-start rounded-[18px] bg-ink px-8 text-[20px] font-semibold text-white print:hidden">
      Print this card
    </button>
  );
}
