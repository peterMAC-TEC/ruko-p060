// Voice Trust: a perfect voice is not proof of who is calling. Two things to do, and what a real caller never does.
// Shown on the demo's result screen and the Companion's after-call help.
export function VoiceTrust({ lang }: { lang: "en" | "hing" }) {
  const en = lang === "en";
  return (
    <section className="mt-6 rounded-[18px] bg-cream/60 p-5">
      <h2 className="display text-[28px] leading-tight">{en ? "A perfect voice is not proof." : "Ek perfect awaaz saboot nahi hai."}</h2>
      <p className="mt-2 text-[19px] leading-snug">
        {en ? "AI can copy a voice. So Ruko protects the moment the money moves, and you can too:" : "AI kisi ki bhi awaaz copy kar sakta hai. Isliye Ruko paise ke pal ko bachata hai, aap bhi bacha sakte hain:"}
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-[19px] leading-snug">
        <li>
          <b>{en ? "Ask for the family code word." : "Family code word poochhiye."}</b> {en ? "A real relative knows it. A copied voice does not." : "Asli rishtedar ko pata hota hai. Copy ki hui awaaz ko nahi."}
        </li>
        <li>
          <b>{en ? "Hang up and call back" : "Call kaatiye aur wapas call kijiye"}</b> {en ? "on a number you already know." : "aise number par jo aapke paas pehle se hai."}
        </li>
      </ul>
      <h3 className="mt-4 text-[16px] font-semibold tracking-[0.1em] text-ink-soft uppercase">{en ? "A real officer or relative will never" : "Asli officer ya rishtedar kabhi nahi karenge"}</h3>
      <ul className="mt-2 flex flex-col gap-1 text-[19px]">
        <li>· {en ? "keep you on the line or on camera" : "aapko line ya camera par rokenge"}</li>
        <li>· {en ? "ask you to pay to prove you are innocent" : "nirdosh sabit karne ke liye paise maangenge"}</li>
        <li>· {en ? "ask you to keep it secret from your family" : "parivar se chhupane ko kahenge"}</li>
      </ul>
    </section>
  );
}
