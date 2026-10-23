"use client";

import type { CSSProperties, ReactNode } from "react";
import results from "@/data/eval-results.json";
import { SOURCES } from "@/lib/deck-content";
import { Arrow, B, Brush, Count, delayStyle as d, Label, Letters, RukoMark, Stamp, TacticOctagon, Words } from "./parts";

// The slides. Every slide is 1920x1080 and draws itself in SVG and CSS. `step` is the build (0 = first view).
// Body text stays at about 25 words a slide; the detail lives in the speaker notes (lib/deck-content.ts).

export type Theme = "paper" | "ink" | "blue";
export interface SlideDef {
  id: string;
  builds: number;
  theme: Theme;
  render: (step: number) => ReactNode;
}

const PAD: CSSProperties = { position: "absolute", inset: 0, padding: "96px 128px" };
const pct = (x: number) => Math.round(x * 1000) / 10;
const R = results;

function Source({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className="d-source" style={{ position: "absolute", left: 128, right: 128, bottom: 44, color: light ? "rgba(255,255,255,0.75)" : "var(--ink)" }}>
      {children}
    </p>
  );
}

function Kicker({ children, color = "var(--ink)" }: { children: ReactNode; color?: string }) {
  return (
    <div className="a-fade" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ width: 18, height: 18, background: "var(--marigold)", transform: "rotate(45deg)", border: "3px solid var(--ink)" }} />
      <Label color={color}>{children}</Label>
    </div>
  );
}

function H({ children, size = 150, color, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <h2 className="d-head" style={{ fontSize: size, color, margin: "18px 0 0", ...style }}>
      {children}
    </h2>
  );
}

function Mentor({ q }: { q: string }) {
  return (
    <div className="a-fade" style={{ ...d(200), display: "inline-flex", alignItems: "center", gap: 14, background: "var(--ink)", color: "#fff", padding: "12px 22px", borderRadius: 999, fontSize: 24 }}>
      <span className="d-mono" style={{ color: "var(--marigold)", fontWeight: 800, fontSize: 18, letterSpacing: "0.14em" }}>
        MENTOR ASKED
      </span>
      {q}
    </div>
  );
}

/** A phone frame around a real screenshot of the live app. */
function Phone({ src, w = 300, label, delay = 0 }: { src: string; w?: number; label?: string; delay?: number }) {
  return (
    <figure className="a-rise" style={{ ...d(delay), margin: 0, textAlign: "center" }}>
      <div style={{ width: w, padding: 10, background: "var(--ink)", borderRadius: 44, boxShadow: "12px 12px 0 rgba(20,18,43,0.25)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label ?? ""} width={w - 20} style={{ display: "block", width: w - 20, height: (w - 20) * (844 / 390), objectFit: "cover", objectPosition: "top", borderRadius: 34 }} />
      </div>
      {label && (
        <figcaption className="d-mono" style={{ marginTop: 18, fontSize: 21, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </figcaption>
      )}
    </figure>
  );
}

function Check({ yes, delay }: { yes: boolean | "part"; delay: number }) {
  if (yes === "part")
    return (
      <span className="d-mono a-fade" style={{ ...d(delay), fontSize: 26, fontWeight: 800, color: "var(--amber)" }}>
        PARTLY
      </span>
    );
  return yes ? (
    <svg width="54" height="54" viewBox="0 0 54 54" aria-label="yes">
      <circle cx="27" cy="27" r="24" fill="var(--green)" className="a-fade" style={d(delay)} />
      <path d="M15 28 L24 37 L40 18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="a-draw" style={{ ["--len" as string]: 50, ...d(delay + 150) }} />
    </svg>
  ) : (
    <svg width="54" height="54" viewBox="0 0 54 54" aria-label="no">
      <path d="M18 18 L36 36 M36 18 L18 36" stroke="rgba(20,18,43,0.35)" strokeWidth="6" strokeLinecap="round" className="a-draw" style={{ ["--len" as string]: 30, ...d(delay) }} />
    </svg>
  );
}

const TACTICS = ["Fake authority", "Fear", "Isolation", "Secrecy", "Urgency", "Fake refund", "Payment pressure", "Arrest threat"];

const ALL: SlideDef[] = [
  // 1 ─ TITLE
  {
    id: "title",
    builds: 0,
    theme: "paper",
    render: () => (
      <div style={{ ...PAD, display: "flex", alignItems: "center", gap: 90 }}>
        <RukoMark size={430} vt="ruko-oct" />
        <div>
          <h1 className="d-head" style={{ fontSize: 330, margin: 0, letterSpacing: "0.02em" }}>
            <Letters text="RUKO" delay={700} gap={130} />
          </h1>
          <p className="d-hindi a-fade" style={{ ...d(1350), fontSize: 110, margin: "-10px 0 0", color: "var(--red)" }}>
            रुको
          </p>
          <p style={{ fontSize: 50, fontWeight: 700, margin: "26px 0 0", lineHeight: 1.15 }}>
            <Words text="Stop the scam" delay={1500} /> <br />
            <span style={{ position: "relative", display: "inline-block" }}>
              <Words text="before the money moves." delay={1700} />
              <Brush width={620} delay={2300} style={{ position: "absolute", left: 0, bottom: -26 }} />
            </span>
          </p>
          <p className="d-mono a-fade" style={{ ...d(2500), fontSize: 24, marginTop: 64, letterSpacing: "0.14em" }}>
            FORGEX 2.0 · P060 · TRACK: MONEY
          </p>
        </div>
      </div>
    ),
  },

  // 2 ─ THE HOOK
  {
    id: "hook",
    builds: 4,
    theme: "ink",
    render: (step) => {
      const lines = ["“This is the CBI.”", "“Your Aadhaar is linked to a crime.”", "“Do not hang up.”", "“Do not tell your family.”"];
      return (
        <div style={{ ...PAD, display: "flex", alignItems: "center", gap: 110 }}>
          <div style={{ position: "relative", width: 360, height: 720, flexShrink: 0 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="a-ring-loop" style={{ ...d(i * 700), position: "absolute", inset: 120, borderRadius: "50%", border: "4px solid var(--marigold)" }} />
            ))}
            <div className="a-buzz" style={{ position: "absolute", inset: 0, background: "#1e1c3a", border: "6px solid #fbf6ec", borderRadius: 56, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 120, color: "#fff" }}>
              <div style={{ width: 130, height: 130, borderRadius: "50%", background: "#3a3760", display: "grid", placeItems: "center", fontSize: 64 }}>?</div>
              <p className="d-mono" style={{ fontSize: 22, marginTop: 36, opacity: 0.7, letterSpacing: "0.14em" }}>
                INCOMING CALL
              </p>
              <p className="d-head" style={{ fontSize: 64, marginTop: 8 }}>
                Unknown number
              </p>
              <div style={{ marginTop: "auto", marginBottom: 60, display: "flex", gap: 60 }}>
                <span style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--red)" }} />
                <span style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--green)" }} />
              </div>
            </div>
          </div>
          <div style={{ color: "#fff" }}>
            <Label color="var(--marigold)">1 · Problem · a typical scam script (role-play)</Label>
            <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 22 }}>
              {lines.map((l, i) => (
                <B key={l} n={i + 1} step={step}>
                  <p className="d-head" style={{ fontSize: 92, margin: 0, color: i === 3 ? "var(--marigold)" : "#fff" }}>
                    <Words text={l} gap={90} />
                  </p>
                </B>
              ))}
            </div>
          </div>
        </div>
      );
    },
  },

  // 3 ─ THE SCALE
  {
    id: "scale",
    builds: 2,
    theme: "paper",
    render: (step) => (
      <div style={PAD}>
        <Kicker>3 · Opportunity · digital-arrest complaints, India</Kicker>
        <H size={120}>
          <Words text="Doubled in one year." />
        </H>
        <div style={{ display: "flex", gap: 90, marginTop: 50, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 46, alignItems: "flex-end", height: 470 }}>
            {[
              { y: "2023", v: 60676, h: 210 },
              { y: "2024", v: 123672, h: 430 },
            ].map((b, i) => (
              <div key={b.y} style={{ textAlign: "center" }}>
                <p className="d-head" style={{ fontSize: 66, margin: "0 0 10px" }}>
                  <Count to={b.v} delay={300 + i * 300} />
                </p>
                <div className="a-rise" style={{ ...d(200 + i * 300), width: 210, height: b.h, background: i ? "var(--red)" : "var(--ink)", border: "4px solid var(--ink)", transformOrigin: "bottom" }} />
                <p className="d-mono" style={{ fontSize: 26, marginTop: 12, fontWeight: 700 }}>
                  {b.y}
                </p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 30, paddingBottom: 40 }}>
            <div className="d-box a-rise" style={{ ...d(900), padding: "26px 34px" }}>
              <p className="d-head" style={{ fontSize: 96, margin: 0, color: "var(--red)" }}>
                <Count to={1935} prefix="₹" suffix=" cr" delay={900} />
              </p>
              <p style={{ fontSize: 30, margin: "6px 0 0" }}>lost to digital arrest in 2024</p>
            </div>
            <B n={1} step={step}>
              <div className="d-box" style={{ padding: "26px 34px" }}>
                <p className="d-head" style={{ fontSize: 80, margin: 0 }}>
                  <Count to={103488} /> <span style={{ fontSize: 50 }}>· ₹4,005 cr</span>
                </p>
                <p style={{ fontSize: 30, margin: "6px 0 0" }}>fraud complaints and losses of senior citizens, 2025</p>
              </div>
            </B>
            <B n={2} step={step}>
              <p style={{ fontSize: 30, margin: 0, borderLeft: "8px solid var(--amber)", paddingLeft: 18 }}>
                Early 2025 data suggests a fall. <b>Awareness works… for now.</b>
              </p>
            </B>
          </div>
        </div>
        <Source>
          {SOURCES.daSC}. {SOURCES.seniors}.
        </Source>
      </div>
    ),
  },

  // 4 ─ WHO IT HURTS
  {
    id: "who",
    builds: 0,
    theme: "paper",
    render: () => (
      <div style={{ ...PAD, display: "flex", alignItems: "center", gap: 100 }}>
        <svg viewBox="0 0 520 620" width={520} height={620} aria-label="An illustrated older woman holding a phone" role="img" className="a-fade">
          <circle cx="260" cy="300" r="250" fill="var(--marigold)" />
          {/* body and sari drape */}
          <path d="M110 620 C 120 470, 190 420, 260 420 C 330 420, 400 470, 410 620 Z" fill="#c2410c" stroke="var(--ink)" strokeWidth="6" />
          <path d="M190 440 C 260 520, 330 520, 380 470 L 400 620 L 300 620 Z" fill="#9a3412" stroke="var(--ink)" strokeWidth="6" />
          {/* head */}
          <rect x="235" y="370" width="50" height="60" rx="18" fill="#a86f4c" stroke="var(--ink)" strokeWidth="6" />
          <ellipse cx="260" cy="300" rx="92" ry="104" fill="#a86f4c" stroke="var(--ink)" strokeWidth="6" />
          <path d="M168 300 C 160 210, 220 180, 260 182 C 310 182, 362 214, 352 300 C 338 250, 300 232, 260 232 C 222 232, 184 250, 168 300 Z" fill="#e8e3da" stroke="var(--ink)" strokeWidth="6" />
          <circle cx="260" cy="196" r="34" fill="#e8e3da" stroke="var(--ink)" strokeWidth="6" />
          {/* glasses */}
          <circle cx="226" cy="300" r="24" fill="none" stroke="var(--ink)" strokeWidth="6" />
          <circle cx="294" cy="300" r="24" fill="none" stroke="var(--ink)" strokeWidth="6" />
          <path d="M250 300 L 270 300" stroke="var(--ink)" strokeWidth="6" />
          <circle cx="226" cy="302" r="6" fill="var(--ink)" />
          <circle cx="294" cy="302" r="6" fill="var(--ink)" />
          <path d="M236 356 Q 260 344 284 356" fill="none" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
          <circle cx="260" cy="262" r="6" fill="var(--red)" />
          {/* the phone */}
          <rect x="330" y="380" width="66" height="120" rx="12" fill="var(--ink)" transform="rotate(14 363 440)" />
          <path d="M318 470 C 334 440, 360 430, 380 446" fill="none" stroke="#a86f4c" strokeWidth="26" strokeLinecap="round" />
        </svg>
        <div style={{ maxWidth: 940 }}>
          <Kicker>Who it hurts</Kicker>
          <H size={118}>
            <Words text="Parents with savings. Families who find out too late." />
          </H>
          <p style={{ fontSize: 36, lineHeight: 1.35, marginTop: 34 }} className="a-fade">
            Adults aged 65 to 85 in India. Savings or a pension. Not at ease with UPI.
          </p>
          <div className="d-box a-rise" style={{ ...d(900), marginTop: 36, padding: "26px 32px", background: "var(--ink)", color: "#fff" }}>
            <p style={{ fontSize: 40, fontWeight: 700, margin: 0 }}>
              Our promise: <span style={{ color: "var(--marigold)" }}>they stop before paying.</span> Their family knows right away.
            </p>
          </div>
        </div>
        <p className="d-source" style={{ position: "absolute", left: 128, bottom: 44 }}>
          Original illustration. Not a real person.
        </p>
      </div>
    ),
  },

  // 5 ─ WHY IT'S HARD
  {
    id: "why",
    builds: 2,
    theme: "paper",
    render: (step) => (
      <div style={PAD}>
        <Kicker>The insight</Kicker>
        <H size={120}>
          <Words text="They know. They still pay." />
        </H>
        <div style={{ position: "relative", height: 260, marginTop: 30 }}>
          <p className="d-head" style={{ fontSize: 230, margin: 0, color: "rgba(20,18,43,0.9)", letterSpacing: "0.04em" }} aria-label="Awareness">
            {Array.from("AWARENESS").map((c, i) => (
              <span key={`${c}${i}-${step >= 1}`} className={step >= 1 ? "a-fall" : "a-crack"} style={{ display: "inline-block", ["--r" as string]: `${(i % 2 ? 1 : -1) * (12 + i * 4)}deg`, ...d(i * 60) }}>
                {c}
              </span>
            ))}
          </p>
          <B n={2} step={step} style={{ position: "absolute", left: 0, top: 40 }}>
            <Stamp size={66} rot={-4} color="var(--red)">
              Protect the moment the money moves
            </Stamp>
          </B>
        </div>
        <B n={1} step={step}>
          <div style={{ display: "flex", gap: 34, marginTop: 40 }}>
            {["Panic beats awareness.", "The caller cuts off the family.", "A perfect voice is no proof of identity."].map((t, i) => (
              <div key={t} className="d-box a-rise" style={{ ...d(700 + i * 150), padding: "24px 28px", flex: 1, fontSize: 36, fontWeight: 700 }}>
                {t}
              </div>
            ))}
          </div>
        </B>
        <Source>{SOURCES.mcafee}. That AI voices could reverse the fall is our hypothesis.</Source>
      </div>
    ),
  },

  // 6 ─ THREE LAYERS
  {
    id: "layers",
    builds: 4,
    theme: "paper",
    render: (step) => {
      const L = [
        { k: "BEFORE THE CALL", t: "The family decides, calmly, in advance.", s: "Setup, a one-line Rule Card, a family code word.", c: "var(--green)" },
        { k: "DURING THE CALL", t: "One big STOP. One action: hang up.", s: "Number risk, the scam check, a silent family alert.", c: "var(--amber)" },
        { k: "AT THE MONEY", t: "The payment waits for the family.", s: "Cooling-off, trusted-person approval, duress PIN, kill switch.", c: "var(--red)" },
      ];
      return (
        <div style={{ ...PAD, display: "flex", gap: 90 }}>
          {/* the traffic signal: lights switch on in turn */}
          <div style={{ width: 230, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 70 }}>
            <div style={{ background: "var(--ink)", borderRadius: 40, padding: 26, display: "flex", flexDirection: "column", gap: 26, boxShadow: "10px 10px 0 rgba(20,18,43,0.25)" }}>
              {[2, 1, 0].map((i) => (
                <span key={i} style={{ width: 140, height: 140, borderRadius: "50%", background: L[i].c, opacity: step === i + 1 || (step >= 4 && true) ? 1 : 0.16, transition: "opacity 400ms", boxShadow: step === i + 1 ? `0 0 60px ${L[i].c}` : "none" }} />
              ))}
            </div>
            <div style={{ width: 34, height: 220, background: "var(--ink)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Kicker>4 · Solution · the future workflow</Kicker>
            <div style={{ marginTop: 14 }}>
              <Mentor q="Is the intervention at the right time? Will a panicking person act right?" />
            </div>
            <H size={104} style={{ marginTop: 28 }}>
              <Words text="Three layers. Before the money moves." />
            </H>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 34 }}>
              {L.map((l, i) => (
                <B key={l.k} n={i + 1} step={step}>
                  <div className="d-box" style={{ padding: "20px 28px", borderLeft: `18px solid ${l.c}` }}>
                    <p className="d-mono" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.14em", margin: 0 }}>
                      {l.k}
                    </p>
                    <p style={{ fontSize: 38, fontWeight: 700, margin: "4px 0 0" }}>{l.t}</p>
                    <p style={{ fontSize: 26, margin: "2px 0 0", opacity: 0.75 }}>{l.s}</p>
                  </div>
                </B>
              ))}
              <B n={4} step={step}>
                <p className="d-head" style={{ fontSize: 58, margin: "6px 0 0", color: "var(--red)" }}>
                  We don&rsquo;t rely on a panicking person to make the right call.
                </p>
              </B>
            </div>
          </div>
        </div>
      );
    },
  },

  // 7 ─ THE PRODUCT
  {
    id: "product",
    builds: 0,
    theme: "paper",
    render: () => (
      <div style={PAD}>
        <Kicker>The product · one core flow, live</Kicker>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 40 }}>
          {[
            ["/deck/1-ring.png", "It rings"],
            ["/deck/2-call.png", "He pressures"],
            ["/deck/3-stop.png", "Ruko: STOP"],
            ["/deck/4-safe.png", "She hangs up"],
            ["/deck/6-family.png", "Family knows"],
          ].map(([src, l], i) => (
            <Phone key={src} src={src} w={292} label={l} delay={i * 220} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 128, right: 128, bottom: 80, display: "flex", alignItems: "center", gap: 24 }}>
          <Arrow width={160} delay={1300} />
          <p className="d-head a-fade" style={{ ...d(1500), fontSize: 66, margin: 0 }}>
            Try it: <span style={{ background: "var(--marigold)", padding: "0 14px" }}>ruko-seven.vercel.app</span>
          </p>
          <span style={{ marginLeft: "auto" }}>
            <Stamp size={26} rot={4} color="var(--ink)" delay={1800}>
              Real screens · role-play
            </Stamp>
          </span>
        </div>
      </div>
    ),
  },

  // 8 ─ THE STOP MOMENT
  {
    id: "stop",
    builds: 2,
    theme: "paper",
    render: (step) => (
      <div style={{ ...PAD, background: "#e9e4da" }}>
        <div style={{ display: "flex", gap: 40, alignItems: "center", height: "100%" }}>
          <div style={{ position: "relative", width: 380, flexShrink: 0, textAlign: "center" }}>
            {/* the caller, frozen and greyed, then tagged */}
            <svg viewBox="0 0 280 280" width={360} height={360} aria-label="The caller, as a silhouette">
              <path d="M40 280 C46 222 92 204 140 204 C188 204 234 222 240 280 Z" fill="#8f8a84" />
              <ellipse cx="140" cy="132" rx="50" ry="58" fill="#8f8a84" />
              <g className="a-fall" style={{ ...d(1100), ["--r" as string]: "40deg" }}>
                <path d="M82 110 C80 54 110 38 140 38 C170 38 200 54 198 110 C186 98 168 94 140 94 C112 94 94 98 82 110 Z" fill="#5e5a56" />
                <path d="M94 106 Q140 132 186 106 L182 115 Q140 140 98 115 Z" fill="#44413e" />
              </g>
            </svg>
            <div style={{ position: "absolute", left: 0, right: 0, top: 210 }}>
              <Stamp size={40} rot={-8} color="var(--red)" delay={1400}>
                Fake officer
              </Stamp>
            </div>
          </div>
          <div style={{ position: "relative", flex: 1, display: "grid", placeItems: "center" }}>
            <span className="a-ring" style={{ ...d(650), position: "absolute", width: 520, height: 520, borderRadius: "50%", border: "10px solid var(--red)" }} />
            <div className="a-drop" style={{ ...d(250), position: "relative", viewTransitionName: "ruko-oct" } as CSSProperties}>
              <TacticOctagon size={560} lit={TACTICS.map(() => step >= 1)} labels={TACTICS} delay={100} />
              <div style={{ position: "absolute", left: 0, right: 0, top: "40%", transform: "translateY(-50%)", textAlign: "center", color: "#fff", pointerEvents: "none" }}>
                <p className="d-head" style={{ fontSize: 190, margin: 0 }}>
                  <Letters text="RUKO" delay={700} gap={120} />
                </p>
                <p className="d-hindi a-fade" style={{ ...d(1250), fontSize: 76, margin: "-6px 0 0" }}>
                  रुको
                </p>
              </div>
            </div>
          </div>
        </div>
        <B n={2} step={step} style={{ position: "absolute", left: 128, right: 128, bottom: 70 }}>
          <p className="d-head" style={{ fontSize: 64, margin: 0, textAlign: "center" }}>
            Real officers never ask you to pay. <span style={{ color: "var(--red)" }}>Hang up.</span>
          </p>
        </B>
        {step < 1 && (
          <p className="d-mono" style={{ position: "absolute", right: 128, bottom: 70, fontSize: 22, letterSpacing: "0.14em" }}>
            NEXT: THE TACTICS HE USED →
          </p>
        )}
      </div>
    ),
  },

  // 9 ─ AI LOGIC AND ARCHITECTURE
  {
    id: "arch",
    builds: 3,
    theme: "blue",
    render: (step) => {
      const boxes = [
        { t: "Inputs", s: "what comes in", p: ["The person's voice or typing", "A number, a message, a photo", "A payment request"] },
        { t: "AI / Model", s: "reads and words", p: ["Classifies unclear replies", "Extracts scam signs", "Confidence score"], ai: true },
        { t: "Logic", s: "code decides", p: ["Call state machine", "Threat engine: 17 tactics, log-odds", "Guard, zod, confidence ≥ 0.6"] },
        { t: "Tools", s: "act and store", p: ["Money Lock, Ruko Guard API", "Family alerts", "Supabase: signal codes only"] },
        { t: "Outputs", s: "what people see", p: ["STOP screen", "Family alert", "Payment paused"] },
      ];
      return (
        <div style={{ ...PAD, color: "#fff" }}>
          <Label color="#8fb6ff">6 · Architecture · inputs → AI → logic → tools → outputs</Label>
          <H size={120} color="#fff">
            <Words text="AI reads and words." /> <Words text="Code decides." delay={350} className="" accent={["Code", "decides"]} accentClass="" />
          </H>
          <div style={{ position: "relative", display: "flex", gap: 22, marginTop: 50 }}>
            {[1, 2, 3].map((k) =>
              step >= k ? (
                <span key={`p${k}-${step}`} className="a-packet" style={{ position: "absolute", top: -22, left: 10, width: 24, height: 24, borderRadius: "50%", background: "var(--marigold)", boxShadow: "0 0 24px var(--marigold)", ["--dist" as string]: "1600px", ...d((k - 1) * 250) }} />
              ) : null,
            )}
            {boxes.map((b, i) => (
              <div key={i} className="a-rise" style={{ ...d(200 + i * 140), flex: 1, border: `3px solid ${b.ai ? "#5b9dff" : "rgba(255,255,255,0.75)"}`, background: b.ai ? "rgba(31,111,235,0.35)" : "rgba(11,29,58,0.85)", borderRadius: 18, padding: "22px 22px 26px" }}>
                <p className="d-mono" style={{ fontSize: 20, color: "#8fb6ff", margin: 0 }}>
                  {i + 1}
                </p>
                <p className="d-head" style={{ fontSize: 50, margin: "4px 0 0" }}>
                  {b.t}
                </p>
                <p style={{ fontSize: 22, opacity: 0.7, margin: "2px 0 16px" }}>{b.s}</p>
                {b.p.map((x) => (
                  <p key={x} style={{ fontSize: 25, margin: "8px 0 0", lineHeight: 1.2, borderLeft: `4px solid ${b.ai ? "#5b9dff" : "var(--marigold)"}`, paddingLeft: 10 }}>
                    {x}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <B n={2} step={step}>
            <div style={{ display: "flex", gap: 22, marginTop: 34 }}>
              <div style={{ flex: 1, border: "3px solid #5b9dff", borderRadius: 18, padding: "18px 24px", background: "rgba(31,111,235,0.25)" }}>
                <p className="d-mono" style={{ fontSize: 22, color: "#8fb6ff", margin: 0, fontWeight: 800 }}>AI READS AND WORDS</p>
                <p style={{ fontSize: 28, margin: "6px 0 0" }}>Classifies unclear replies, extracts scam signs, words calm guidance.</p>
              </div>
              <div style={{ flex: 1, border: "3px solid var(--marigold)", borderRadius: 18, padding: "18px 24px", background: "rgba(255,176,0,0.12)" }}>
                <p className="d-mono" style={{ fontSize: 22, color: "var(--marigold)", margin: 0, fontWeight: 800 }}>CODE DECIDES</p>
                <p style={{ fontSize: 28, margin: "6px 0 0" }}>The STOP, the risk score, the payment hold, every safety check.</p>
              </div>
            </div>
          </B>
          <B n={3} step={step}>
            <p style={{ fontSize: 26, marginTop: 24, opacity: 0.85 }}>Privacy: signal codes only. No recordings. Salted hashes. Row-level security. Works offline, rule-only.</p>
          </B>
        </div>
      );
    },
  },

  // 10 ─ ONE TURN, MEASURED
  {
    id: "turn",
    builds: 0,
    theme: "blue",
    render: () => {
      const steps = [
        { t: "Rules read it", v: "< 1 µs", c: "#fff" },
        { t: "AI classifies (only if unclear)", v: `${(R.latencyMs.ai.median / 1000).toFixed(1)} s`, c: "#5b9dff" },
        { t: "State machine decides", v: "≈ 1 µs", c: "var(--marigold)" },
        { t: "Threat engine fuses", v: "≈ 10 µs", c: "var(--marigold)" },
        { t: "Guard checks the line", v: "≈ 2 µs", c: "#fff" },
      ];
      return (
        <div style={{ ...PAD, color: "#fff", display: "flex", gap: 70 }}>
          <div style={{ flex: 1 }}>
            <Label color="#8fb6ff">X-Ray · one turn of the live call</Label>
            <H size={110} color="#fff">
              <Words text="The STOP never waits for AI." />
            </H>
            <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
              {steps.map((s, i) => (
                <div key={s.t} className="a-rise" style={{ ...d(300 + i * 160), display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid rgba(255,255,255,0.2)", paddingBottom: 10 }}>
                  <span style={{ fontSize: 34 }}>
                    <span className="d-mono" style={{ color: "#8fb6ff", marginRight: 16 }}>
                      0{i + 1}
                    </span>
                    {s.t}
                  </span>
                  <span className="d-mono" style={{ fontSize: 38, fontWeight: 800, color: s.c }}>
                    {s.v}
                  </span>
                </div>
              ))}
            </div>
            <p className="a-fade" style={{ ...d(1300), fontSize: 28, marginTop: 26, opacity: 0.85 }}>
              AI ignored below 0.6 confidence or after 3.2 s. Offline: rule-only.
            </p>
          </div>
          <figure className="a-rise" style={{ ...d(500), margin: 0, width: 760, alignSelf: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/deck/7-xray.png" alt="Ruko's X-Ray view of a live call turn" width={760} style={{ width: 760, borderRadius: 16, border: "3px solid #5b9dff" }} />
            <figcaption className="d-mono" style={{ fontSize: 20, marginTop: 12, opacity: 0.8 }}>
              Press X in the live call: the real trace
            </figcaption>
          </figure>
          <Source light>Median latencies measured by npm run eval on this machine. AI: network round trip.</Source>
        </div>
      );
    },
  },

  // 11 ─ PROOF
  {
    id: "proof",
    builds: 1,
    theme: "paper",
    render: (step) => (
      <div style={PAD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Kicker>5 · AI thinking · where AI adds value</Kicker>
          <Stamp size={30} rot={3} color="var(--blue)" delay={1200}>
            Synthetic test set
          </Stamp>
        </div>
        <H size={116}>
          <Words text="AI reads what rules miss. Code keeps it safe." />
        </H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 26, marginTop: 44 }}>
          {[
            { big: <Count to={pct(R.reading.accuracy.hybrid)} decimals={1} suffix="%" />, s: "replies read right (hybrid)" },
            { big: <>{R.guard.rejected}/{R.guard.total}</>, s: "unsafe AI outputs blocked" },
            { big: <Count to={pct(R.scamCheck.stop.falseAlarm)} suffix="%" />, s: "false STOPs on genuine calls" },
            { big: <>{pct(R.reading.accuracy.rules)}→{pct(R.reading.accuracy.hybrid)}</>, s: "% replies read right: rules alone, then with AI" },
          ].map((c, i) => (
            <div key={i} className="d-box a-rise" style={{ ...d(300 + i * 150), padding: "26px 28px" }}>
              <p className="d-head" style={{ fontSize: 110, margin: 0, color: i === 1 ? "var(--green)" : "var(--ink)" }}>
                {c.big}
              </p>
              <p style={{ fontSize: 28, margin: "6px 0 0" }}>{c.s}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 40, marginTop: 44, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            {[
              ["Rules only", R.reading.accuracy.rules, "var(--ink)"],
              ["AI only", R.reading.accuracy.ai, "var(--blue)"],
              ["Hybrid (Ruko)", R.reading.accuracy.hybrid, "var(--marigold)"],
            ].map(([l, v, c], i) => (
              <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12 }}>
                <span style={{ width: 230, fontSize: 26, fontWeight: 700 }}>{l as string}</span>
                <span style={{ flex: 1, height: 30, background: "rgba(20,18,43,0.08)", border: "3px solid var(--ink)" }}>
                  <span className="a-rise" style={{ ...d(900 + i * 150), display: "block", height: "100%", width: `${(v as number) * 100}%`, background: c as string, transformOrigin: "left" }} />
                </span>
                <span className="d-mono" style={{ width: 110, fontSize: 28, fontWeight: 800 }}>
                  {pct(v as number)}%
                </span>
              </div>
            ))}
          </div>
          <B n={1} step={step} style={{ width: 640 }}>
            <div style={{ border: "4px dashed var(--ink)", padding: "20px 26px", borderRadius: 10 }}>
              <p className="d-mono" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>NEXT · FIELD TEST</p>
              <p style={{ fontSize: 28, margin: "6px 0 0" }}>10 older adults, role-played calls, with and without Ruko. Results pending.</p>
            </div>
          </B>
        </div>
        <Source>{SOURCES.eval}</Source>
      </div>
    ),
  },

  // 12 ─ WHY RUKO
  {
    id: "compare",
    builds: 0,
    theme: "paper",
    render: () => {
      const cols = ["Any phone", "Family in the loop", "At the payment", "Hinglish, elder-first"];
      const rows: { n: string; s: string; v: (boolean | "part")[] }[] = [
        { n: "Google call scam detection", s: "Newer Pixels, off by default", v: [false, false, false, false] },
        { n: "UPI Circle", s: "Delegates spending to others", v: [true, "part", false, false] },
        { n: "DoT Fraud Risk Indicator", s: "Rates numbers, for banks", v: [false, false, "part", false] },
        { n: "Ruko", s: "Mock bank today; bank API next", v: [true, true, true, true] },
      ];
      return (
        <div style={PAD}>
          <Kicker>Why Ruko, not existing tools</Kicker>
          <H size={110}>
            <Words text="The others warn. Ruko holds the money." />
          </H>
          <table style={{ width: "100%", marginTop: 40, borderCollapse: "collapse", fontSize: 30 }}>
            <thead>
              <tr>
                <th />
                {cols.map((c) => (
                  <th key={c} className="d-mono" style={{ fontSize: 22, textAlign: "center", padding: "0 10px 14px", letterSpacing: "0.08em" }}>
                    {c.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={r.n} style={{ borderTop: "3px solid var(--ink)", background: ri === 3 ? "rgba(255,176,0,0.25)" : "transparent" }}>
                  <td style={{ padding: "18px 10px" }}>
                    <b style={{ fontSize: 34 }}>{r.n}</b>
                    <span style={{ display: "block", fontSize: 22, opacity: 0.7 }}>{r.s}</span>
                  </td>
                  {r.v.map((v, ci) => (
                    <td key={ci} style={{ textAlign: "center" }}>
                      <Check yes={v} delay={400 + ri * 300 + ci * 90} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Source>Google: Pixel 9 and later at launch, opt-in (Nov 2025). UPI Circle: NPCI, Aug 2024. FRI: DoT, May 2025. See docs/RESEARCH-UPI-BANKS.md.</Source>
        </div>
      );
    },
  },

  // 13 ─ BUSINESS MODEL
  {
    id: "business",
    builds: 3,
    theme: "paper",
    render: (step) => {
      const paths = [
        { who: "Banks and payment apps", what: "Ruko Guard API, per protected account.", why: "Cuts fraud losses; fits the RBI's draft rules.", test: "A bank pilot conversation" },
        { who: "Families", what: "Core free. A paid family plan.", why: "Adult children buy peace of mind.", test: "A willingness-to-pay survey" },
        { who: "Partners, later", what: "Telcos bundle warnings; insurers discount cover.", why: "Fewer losses, fewer claims.", test: "One partner conversation" },
      ];
      return (
        <div style={PAD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Mentor q="What is the business model?" />
            <Stamp size={28} rot={4} color="var(--amber)" delay={600}>
              Hypotheses to test
            </Stamp>
          </div>
          <H size={110} style={{ marginTop: 26 }}>
            <Words text="Banks pay to stop the loss." />
          </H>
          <div style={{ display: "flex", gap: 30, marginTop: 44 }}>
            {paths.map((p, i) => (
              <B key={p.who} n={i + 1} step={step} style={{ flex: 1 }}>
                {/* a signpost board */}
                <div style={{ position: "relative", background: i === 0 ? "var(--marigold)" : "#fff", border: "4px solid var(--ink)", boxShadow: "10px 10px 0 var(--ink)", padding: "26px 28px 30px", clipPath: "polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)", minHeight: 300 }}>
                  <p className="d-mono" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>0{i + 1}</p>
                  <p className="d-head" style={{ fontSize: 50, margin: "4px 0 0" }}>{p.who}</p>
                  <p style={{ fontSize: 28, fontWeight: 700, margin: "10px 0 0", paddingRight: 40 }}>{p.what}</p>
                  <p style={{ fontSize: 24, margin: "6px 0 0", opacity: 0.8, paddingRight: 40 }}>{p.why}</p>
                </div>
                <p className="d-mono" style={{ fontSize: 21, marginTop: 18, letterSpacing: "0.06em" }}>
                  NEXT TEST: {p.test.toUpperCase()}
                </p>
              </B>
            ))}
          </div>
          <Source>{SOURCES.rbi}: a one-hour delay above ₹10,000, trusted-person approval for 70+, a kill switch. No prices or market sizes claimed.</Source>
        </div>
      );
    },
  },

  // 14 ─ ROADMAP AND LIMITS
  {
    id: "roadmap",
    builds: 0,
    theme: "paper",
    render: () => (
      <div style={PAD}>
        <Kicker>Roadmap</Kicker>
        <H size={110}>
          <Words text="Built. Next: real people, a real bank." />
        </H>
        <div style={{ display: "flex", gap: 26, marginTop: 44 }}>
          {[
            ["Now", "Live PWA, the live call, Money Lock in a mock bank, trial lab, eval."],
            ["30 days", "Field test with 10 older adults. Android call screening on real phones."],
            ["90 days", "A Ruko Guard API pilot with one bank or payment app."],
          ].map(([t, s], i) => (
            <div key={t} className="d-box a-rise" style={{ ...d(300 + i * 180), flex: 1, padding: "26px 28px", background: i === 0 ? "var(--ink)" : "#fff", color: i === 0 ? "#fff" : "var(--ink)" }}>
              <p className="d-head" style={{ fontSize: 70, margin: 0, color: i === 0 ? "var(--marigold)" : "var(--ink)" }}>{t}</p>
              <p style={{ fontSize: 30, margin: "10px 0 0", lineHeight: 1.3 }}>{s}</p>
            </div>
          ))}
        </div>
        <div className="a-fade" style={{ ...d(1000), marginTop: 40, border: "4px dashed var(--ink)", padding: "20px 28px", borderRadius: 10 }}>
          <p className="d-mono" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>WHAT IT DOESN&rsquo;T DO YET</p>
          <p style={{ fontSize: 30, margin: "6px 0 0" }}>No call interception. The bank is a mock. Field results pending.</p>
        </div>
      </div>
    ),
  },

  // 15 ─ CLOSE
  {
    id: "close",
    builds: 0,
    theme: "ink",
    render: () => (
      <div style={{ ...PAD, color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <H size={150} color="#fff">
          <Words text="Either way, the money didn't move." gap={90} />
        </H>
        <p style={{ fontSize: 46, marginTop: 34, maxWidth: 1450, lineHeight: 1.3 }} className="a-fade">
          Ruko doesn&rsquo;t try to win the argument with a scammer. <span style={{ color: "var(--marigold)" }}>It protects the moment that matters.</span>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 70 }}>
          <RukoMark size={130} vt="ruko-oct" delay={600} />
          <div>
            <p className="d-head a-fade" style={{ ...d(900), fontSize: 64, margin: 0 }}>
              ruko-seven.vercel.app
            </p>
            <p className="d-mono a-fade" style={{ ...d(1100), fontSize: 26, margin: "8px 0 0", letterSpacing: "0.08em" }}>
              SCAM HELP: 1930 · CYBERCRIME.GOV.IN
            </p>
          </div>
        </div>
        <p className="d-mono a-fade" style={{ ...d(1400), position: "absolute", left: 128, bottom: 50, fontSize: 20, opacity: 0.7 }}>
          Built by one non-developer, with AI. Demo prototype: no real money moves.
        </p>
      </div>
    ),
  },

  // A1 ─ TECH STACK
  {
    id: "stack",
    builds: 0,
    theme: "blue",
    render: () => (
      <div style={{ ...PAD, color: "#fff" }}>
        <Label color="#8fb6ff">Appendix · tech stack</Label>
        <H size={100} color="#fff">Under the hood</H>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22, marginTop: 40, fontSize: 30 }}>
          {[
            ["App", "Next.js 16, React 19, TypeScript, Tailwind 4, an installable PWA"],
            ["AI", "OpenRouter: a free Gemma model first, Gemini Flash-Lite backup; zod-checked JSON"],
            ["Data", "Supabase in Mumbai, row-level security, salted hashes, hash-chained evidence log"],
            ["Voice", "Browser speech in; recorded natural Indian voices out"],
            ["Hosting", "Vercel, Mumbai region"],
            ["Quality", "526 checks in 20 suites, a simulator, the eval harness"],
          ].map(([t, s]) => (
            <div key={t} style={{ border: "3px solid rgba(255,255,255,0.6)", borderRadius: 16, padding: "20px 24px" }}>
              <p className="d-mono" style={{ fontSize: 22, color: "var(--marigold)", margin: 0, fontWeight: 800 }}>{t.toUpperCase()}</p>
              <p style={{ margin: "8px 0 0", lineHeight: 1.3 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // A2 ─ HARD QUESTIONS
  {
    id: "qa",
    builds: 0,
    theme: "paper",
    render: () => (
      <div style={PAD}>
        <Kicker>Appendix · hard questions</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginTop: 36, fontSize: 28, lineHeight: 1.3 }}>
          {[
            ["Can Ruko hear real calls?", "No. No interception, no recording. Today the call is a role-play in the app; Android screening grades the number only."],
            ["Can it stop a real payment?", "Only if a bank or payment app calls Ruko Guard. Today it is a mock bank."],
            ["What if the AI is wrong?", "Code decides. Low confidence or slow AI is ignored; the rules always run."],
            ["Are the numbers real-world?", "No. Eval data is synthetic and ours. Field results are pending."],
            ["Privacy?", "Signal codes only, salted hashes, no audio, consent per purpose."],
            ["Why would a bank pay?", "Fraud losses and the RBI's draft rules. A hypothesis we will test."],
          ].map(([q, a]) => (
            <div key={q} className="d-box" style={{ padding: "18px 24px" }}>
              <p style={{ fontWeight: 800, margin: 0 }}>{q}</p>
              <p style={{ margin: "6px 0 0" }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

/** 2 ─ CURRENT STATE: today's workflow, and where nobody steps in. */
const CURRENT: SlideDef = {
  id: "current",
  builds: 1,
  theme: "paper",
  render: (step) => {
    const flow = [
      ["The call", "“This is the CBI.”"],
      ["Fear", "A made-up case, a warrant"],
      ["Isolation", "“Stay on video. Tell no one.”"],
      ["The transfer", "To a “safe account”"],
      ["Too late", "Family finds out days later"],
    ];
    return (
      <div style={PAD}>
        <Kicker>2 · Current state · today&rsquo;s workflow</Kicker>
        <H size={116}>
          <Words text="Nobody steps in before the money moves." />
        </H>
        <div style={{ display: "flex", alignItems: "stretch", gap: 14, marginTop: 56 }}>
          {flow.map(([t, s2], i) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
              <div className="d-box a-rise" style={{ ...d(200 + i * 200), padding: "22px 22px", flex: 1, minHeight: 210, background: i === 4 ? "var(--red)" : "#fff", color: i === 4 ? "#fff" : "var(--ink)" }}>
                <p className="d-head" style={{ fontSize: 48, margin: 0 }}>{t}</p>
                <p style={{ fontSize: 26, margin: "10px 0 0" }}>{s2}</p>
              </div>
              {i < 4 && (
                <span className="d-head a-fade" style={{ ...d(300 + i * 200), fontSize: 60 }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        <B n={1} step={step}>
          <p style={{ fontSize: 34, marginTop: 50, borderLeft: "10px solid var(--amber)", paddingLeft: 20 }}>
            Today: awareness campaigns, and 1930 <b>after</b> the loss. Scam warnings only on some new phones.
          </p>
        </B>
        <Source>Workflow from the problem card (P060) and reported cases. 1930: the national cyber-fraud helpline.</Source>
      </div>
    );
  },
};

/** 7 ─ IMPACT: time saved, quality, scale. */
const IMPACT: SlideDef = {
  id: "impact",
  builds: 0,
  theme: "paper",
  render: () => (
    <div style={PAD}>
      <Kicker>7 · Impact</Kicker>
      <H size={116}>
        <Words text="Seconds to STOP. Any phone." />
      </H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, marginTop: 50 }}>
        {[
          ["Time", "A warning before the money moves, not days after. The family knows in seconds."],
          ["Quality", `${R.guard.rejected}/${R.guard.total} unsafe AI outputs blocked. ${pct(R.scamCheck.stop.falseAlarm)}% false STOPs. 526 automated checks.`],
          ["Scale", "Any phone, Hinglish. Banks plug in through the Ruko Guard API."],
        ].map(([t, s2], i) => (
          <div key={t} className="d-box a-rise" style={{ ...d(300 + i * 200), padding: "28px 30px", background: i === 0 ? "var(--marigold)" : "#fff" }}>
            <p className="d-head" style={{ fontSize: 80, margin: 0 }}>{t}</p>
            <p style={{ fontSize: 32, margin: "12px 0 0", lineHeight: 1.3 }}>{s2}</p>
          </div>
        ))}
      </div>
      <p className="a-fade" style={{ ...d(1100), fontSize: 32, marginTop: 44 }}>
        North star: the share of role-played scam calls where the person stops before paying. <b>Field test with 10 older adults: next.</b>
      </p>
      <Source>
        {SOURCES.eval} {SOURCES.checks}.
      </Source>
    </div>
  ),
};

/** 8 ─ CLOSE, with the business model (the mentor's second question). */
const CLOSE: SlideDef = {
  id: "close",
  builds: 0,
  theme: "ink",
  render: () => (
    <div style={{ ...PAD, color: "#fff" }}>
      <Label color="var(--marigold)">8 · Business model and close</Label>
      <div style={{ display: "flex", gap: 24, marginTop: 26 }}>
        {[
          ["Banks and payment apps", "Pay for the Ruko Guard API per protected account. Fits the RBI's draft rules."],
          ["Families", "Core free. A paid family plan, bought by adult children."],
          ["Partners, later", "Telcos and insurers."],
        ].map(([t, s2], i) => (
          <div key={t} className="a-rise" style={{ ...d(200 + i * 160), flex: 1, border: "3px solid rgba(255,255,255,0.6)", borderRadius: 16, padding: "20px 24px", background: i === 0 ? "rgba(255,176,0,0.18)" : "transparent" }}>
            <p className="d-head" style={{ fontSize: 44, margin: 0, color: i === 0 ? "var(--marigold)" : "#fff" }}>{t}</p>
            <p style={{ fontSize: 26, margin: "8px 0 0" }}>{s2}</p>
          </div>
        ))}
      </div>
      <p className="d-mono a-fade" style={{ ...d(700), fontSize: 20, marginTop: 14, color: "var(--marigold)", letterSpacing: "0.1em" }}>
        HYPOTHESES TO TEST: A BANK PILOT CONVERSATION · A FAMILY WILLINGNESS-TO-PAY SURVEY
      </p>
      <H size={118} color="#fff" style={{ marginTop: 50 }}>
        <Words text="Either way, the money didn't move." gap={80} delay={600} />
      </H>
      <p style={{ fontSize: 40, marginTop: 22, maxWidth: 1500, lineHeight: 1.3 }} className="a-fade">
        Ruko doesn&rsquo;t try to win the argument with a scammer. <span style={{ color: "var(--marigold)" }}>It protects the moment that matters.</span>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 30, position: "absolute", left: 128, bottom: 60 }}>
        <RukoMark size={110} vt="ruko-oct" delay={900} />
        <div>
          <p className="d-head" style={{ fontSize: 56, margin: 0 }}>ruko-seven.vercel.app</p>
          <p className="d-mono" style={{ fontSize: 22, margin: "6px 0 0" }}>SCAM HELP: 1930 · CYBERCRIME.GOV.IN · RBI RULES CITED ARE A DRAFT</p>
        </div>
      </div>
    </div>
  ),
};

const byId = (id: string) => ALL.find((x) => x.id === id)!;
/** The organisers asked for 6 to 8 slides: Problem, Current state, Opportunity, Solution, AI thinking, Architecture, Impact. */

/** 3 ─ OPPORTUNITY AND WHY NOW: the newest sourced numbers, and the AI wave (labelled as our assumption). */
const SCALE2: SlideDef = {
  id: "scale",
  builds: 2,
  theme: "paper",
  render: (step) => {
    const bars = [
      { y: "2023", v: 60676, h: 162, c: "var(--ink)" },
      { y: "2024", v: 123672, h: 330, c: "var(--red)" },
      { y: "2025", v: 58239, h: 155, c: "var(--ink)" },
      { y: "2026*", v: 21900, h: 58, c: "var(--amber)" },
    ];
    return (
      <div style={PAD}>
        <Kicker>3 · Opportunity · and why now</Kicker>
        <H size={104}>
          <Words text="Awareness dented it. AI will bring it back." />
        </H>
        <div style={{ display: "flex", gap: 56, marginTop: 34, alignItems: "flex-end" }}>
          <div>
            <p className="d-mono" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.12em", margin: "0 0 8px" }}>DIGITAL-ARREST COMPLAINTS, INDIA</p>
            <div style={{ display: "flex", gap: 26, alignItems: "flex-end", height: 420 }}>
              {bars.map((b, i) => (
                <div key={b.y} style={{ textAlign: "center", width: 150 }}>
                  <p className="d-head" style={{ fontSize: 46, margin: "0 0 8px" }}>
                    <Count to={b.v} delay={200 + i * 200} />
                    {b.y === "2026*" ? "+" : ""}
                  </p>
                  <div className="a-rise" style={{ ...d(150 + i * 200), height: b.h, background: b.c, border: "4px solid var(--ink)", transformOrigin: "bottom" }} />
                  <p className="d-mono" style={{ fontSize: 22, marginTop: 10, fontWeight: 700 }}>{b.y}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 24, margin: "10px 0 0" }}>
              Lost: <b>₹1,935 cr</b> (2024) · <b>₹1,211 cr</b> (2025) · <b>₹647 cr</b> (2026*)
            </p>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <B n={1} step={step}>
              <div className="d-box" style={{ padding: "20px 26px" }}>
                <p className="d-head" style={{ fontSize: 66, margin: 0 }}>21.8 lakh</p>
                <p style={{ fontSize: 26, margin: "4px 0 0" }}>cyber-fraud complaints in 2025, up from 19.2 lakh. About ₹19,800 crore lost.</p>
              </div>
            </B>
            <B n={2} step={step}>
              <div style={{ border: "4px solid var(--blue)", boxShadow: "10px 10px 0 var(--blue)", background: "#fff", padding: "20px 26px" }}>
                <p className="d-mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--blue)", margin: 0, letterSpacing: "0.1em" }}>OUR ASSUMPTION: AI MAKES FAKING ANYONE CHEAP</p>
                <p style={{ fontSize: 26, margin: "8px 0 0", lineHeight: 1.3 }}>
                  <b>+1,300%</b> deepfake fraud attempts (2024). <b>$25M</b> lost to one deepfake video call, on a laptop.
                </p>
              </div>
            </B>
          </div>
        </div>
        <Source>
          *2026: January to August. Digital arrest: I4C/MHA status report to the Supreme Court (Free Press Journal, 23 Oct 2026); 2023: I4C via ThePrint. All fraud: I4C/NCRP via The420.in (3 Jan 2026). Pindrop (12 Jun 2025). CNN (Feb 2024).
        </Source>
      </div>
    );
  },
};

export const DECK: SlideDef[] = [byId("hook"), CURRENT, SCALE2, byId("layers"), byId("proof"), byId("arch"), IMPACT, CLOSE];
