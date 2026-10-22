// The calls the Ruko Line demo can play. Caller lines are role-play only (no real names, offices or numbers).
export interface LineScenario {
  id: string;
  title: { en: string; hing: string };
  /** What the phone shows before anyone speaks. */
  number: string;
  contact: boolean;
  genuine: boolean;
  /** What the caller says to each of Ruko's questions, in order. */
  lines: { en: string[]; hing: string[] };
}

export const LINE_SCENARIOS: LineScenario[] = [
  {
    id: "family",
    title: { en: "Priya, saved in contacts", hing: "Priya, contacts mein saved" },
    number: "+91 98450 00002",
    contact: true,
    genuine: true,
    lines: { en: [], hing: [] },
  },
  {
    id: "courier",
    title: { en: "Delivery person, unknown number", hing: "Delivery wala, anjaan number" },
    number: "+91 98000 11122",
    contact: false,
    genuine: true,
    lines: {
      en: ["This is Raj from Swift Couriers. I am outside with a parcel for Mrs Iyer.", "Swift Couriers, my number is 98000 11122. Call me back on it."],
      hing: ["Main Raj bol raha hoon, Swift Couriers se. Mrs Iyer ka parcel gate par hai.", "Swift Couriers. Mera number 98000 11122 hai, isi par call kar lijiye."],
    },
  },
  {
    id: "arrest",
    title: { en: "\"Officer\" says you are under digital arrest", hing: "\"Officer\" kehta hai aap digital arrest mein hain" },
    number: "+91 98111 22334",
    contact: false,
    genuine: false,
    lines: {
      en: ["This is Officer Sethi from the Central Investigation Cell. A case has been registered against you.", "Do not disconnect this call. There is a warrant and you will be arrested."],
      hing: ["Main Officer Sethi bol raha hoon, Central Investigation Cell se. Aapke khilaf case registered hua hai.", "Call mat kaatna. Warrant hai aur aapko arrest kiya jayega."],
    },
  },
  {
    id: "bankmoney",
    title: { en: "\"Bank\" says move your savings to a safe account", hing: "\"Bank\" kehta hai paise safe account mein daalo" },
    number: "+44 7700 900123",
    contact: false,
    genuine: false,
    lines: {
      en: ["I am calling from your bank. Your account is under attack. You must transfer your savings to a safe account today."],
      hing: ["Main aapke bank se bol raha hoon. Aapka account khatre mein hai. Aaj hi paise safe account mein transfer kijiye."],
    },
  },
  {
    id: "pusher",
    title: { en: "Parcel caller who refuses a call-back", hing: "Parcel wala jo call-back se mana karta hai" },
    number: "+91 97000 55501",
    contact: false,
    genuine: false,
    lines: {
      en: ["I am calling about your parcel from customs.", "No need to verify, don't hang up, just stay on the line."],
      hing: ["Main customs se aapke parcel ke baare mein bol raha hoon.", "Verify karne ki zaroorat nahi, call mat kaat, line par bane rahiye."],
    },
  },
];
