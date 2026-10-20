// The scam simulator's scripts: scripted, branching role-play calls from a
// fictional agency ("Central Investigation Cell – DRILL"), so every participant
// hears the same words. Never real agency, officer or company names (BNS §204);
// never a real OTP, card number, Aadhaar or PIN.

export type Stage =
  | "open"
  | "hook"
  | "fear"
  | "isolate"
  | "secrecy"
  | "verify_fake"
  | "pivot_money"
  | "instruct_transfer"
  | "pressure"
  | "close";

export interface DrillStep {
  id: string;
  stage: Stage;
  line_en: string;
  line_hi: string;
  /** Lines to use when the person hesitates or says no. */
  branches?: { hesitate?: { en: string; hi: string } };
  /** Only said when no family member is present (the drill disclosure). */
  optional?: boolean;
}

export interface DrillScript {
  id: string;
  title_en: string;
  title_hi: string;
  caller_name: string;
  caller_role: string;
  is_scam: boolean;
  ruko_pattern_id: string | null;
  steps: DrillStep[];
}

export interface DrillLibrary {
  version: number;
  scripts: DrillScript[];
}

export const DISCLOSURE = {
  en: "This is a Ruko safety practice call. Say RUKO at any time to stop.",
  hi: "यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी RUKO बोलिए।",
};
export const DEBRIEF = {
  en: "This was a Ruko practice call. No real money moved, and you did nothing wrong. Thank you.",
  hi: "यह Ruko की अभ्यास कॉल थी। कोई असली पैसा नहीं गया, और आपने कुछ गलत नहीं किया। धन्यवाद।",
};

/** A minimal library so the lab works before the full scripts are in data/drill-scripts.json. */
export const FALLBACK_LIBRARY: DrillLibrary = {
  version: 0,
  scripts: [
    {
      id: "da_cic",
      title_en: "Digital arrest (fake investigation cell)",
      title_hi: "डिजिटल अरेस्ट (नकली जाँच सेल)",
      caller_name: "Inspector R. Mehra",
      caller_role: "Central Investigation Cell – DRILL",
      is_scam: true,
      ruko_pattern_id: "digital_arrest",
      steps: [
        { id: "s1", stage: "open", line_en: "Hello, this is the Central Investigation Cell. Am I speaking to the account holder?", line_hi: "हैलो, मैं सेंट्रल इन्वेस्टिगेशन सेल से बोल रहा हूँ। क्या मैं खाताधारक से बात कर रहा हूँ?" },
        { id: "s2", stage: "fear", line_en: "A parcel with illegal items was booked using your identity. A case has been registered against you.", line_hi: "आपकी पहचान से गैरकानूनी सामान वाला पार्सल बुक हुआ है। आपके खिलाफ केस दर्ज हुआ है।" },
        { id: "s3", stage: "isolate", line_en: "Do not disconnect this call. Leaving the call will be treated as non-cooperation.", line_hi: "यह कॉल मत काटिए। कॉल छोड़ना असहयोग माना जाएगा।", branches: { hesitate: { en: "Sir, if you cut the call, a warrant will be issued in the next hour.", hi: "अगर आपने कॉल काटी तो अगले एक घंटे में वारंट जारी हो जाएगा।" } } },
        { id: "s4", stage: "secrecy", line_en: "This is a confidential investigation. Do not tell anyone, not even your family.", line_hi: "यह गोपनीय जाँच है। किसी को मत बताइए, परिवार को भी नहीं।" },
        { id: "s5", stage: "verify_fake", line_en: "To verify you, read me the four-digit case code shown on your screen.", line_hi: "आपकी पुष्टि के लिए स्क्रीन पर दिख रहा चार अंकों का केस कोड पढ़िए।" },
        { id: "s6", stage: "pivot_money", line_en: "Your savings must be checked. Move them to the verification account so we can clear your name.", line_hi: "आपकी जमा राशि की जाँच होगी। नाम साफ़ करने के लिए उसे वेरिफिकेशन खाते में डालिए।" },
        { id: "s7", stage: "instruct_transfer", line_en: "Open your bank app now. Send four lakh eighty thousand to 'Verification Account', ID verify dot cic at sahyog.", line_hi: "अभी अपना बैंक ऐप खोलिए। 'वेरिफिकेशन अकाउंट' को चार लाख अस्सी हज़ार भेजिए, आईडी verify.cic@sahyog।", branches: { hesitate: { en: "The money is returned in 24 hours after verification. Do it now or the arrest goes ahead.", hi: "जाँच के बाद 24 घंटे में पैसा वापस आ जाएगा। अभी कीजिए वरना गिरफ़्तारी होगी।" } } },
        { id: "s8", stage: "close", line_en: "Stay on the line until the transfer is done.", line_hi: "ट्रांसफर होने तक लाइन पर रहिए।" },
      ],
    },
    {
      id: "electricity_cut",
      title_en: "Electricity disconnection tonight",
      title_hi: "आज रात बिजली कटेगी",
      caller_name: "Mr. Sharma",
      caller_role: "City Power Board",
      is_scam: true,
      ruko_pattern_id: "electricity_cut",
      steps: [
        { id: "s1", stage: "open", line_en: "Hello, I am calling from City Power Board billing.", line_hi: "हैलो, मैं सिटी पावर बोर्ड बिलिंग से बोल रहा हूँ।" },
        { id: "s2", stage: "fear", line_en: "Your last bill is not updated. Your power will be cut at nine thirty tonight.", line_hi: "आपका पिछला बिल अपडेट नहीं है। आज रात साढ़े नौ बजे आपकी बिजली कट जाएगी।" },
        { id: "s3", stage: "pivot_money", line_en: "To stop it, pay a small update fee of thirteen thousand right now.", line_hi: "इसे रोकने के लिए अभी तेरह हज़ार की अपडेट फ़ीस भरिए।", branches: { hesitate: { en: "The line man is already on the way. Only a few minutes left.", hi: "लाइनमैन रास्ते में है। बस कुछ ही मिनट बचे हैं।" } } },
        { id: "s4", stage: "instruct_transfer", line_en: "Send it to 'Power Update Desk', ID power dot update at sahyog.", line_hi: "'पावर अपडेट डेस्क' को भेजिए, आईडी power.update@sahyog।" },
        { id: "s5", stage: "close", line_en: "Tell me when it is done.", line_hi: "हो जाए तो बताइए।" },
      ],
    },
    {
      id: "ctrl_bank_kyc",
      title_en: "Bank KYC reminder (genuine)",
      title_hi: "बैंक KYC याद दिलाना (असली)",
      caller_name: "Anita",
      caller_role: "Sahyog Bank branch",
      is_scam: false,
      ruko_pattern_id: null,
      steps: [
        { id: "s1", stage: "open", line_en: "Good morning, this is Anita from your Sahyog Bank branch.", line_hi: "नमस्ते, मैं आपकी सहयोग बैंक शाखा से अनीता बोल रही हूँ।" },
        { id: "s2", stage: "hook", line_en: "Your KYC update is due this year. Please visit the branch with your documents whenever convenient.", line_hi: "आपका KYC इस साल अपडेट होना है। अपनी सुविधा से दस्तावेज़ लेकर शाखा आ जाइए।" },
        { id: "s3", stage: "close", line_en: "We will never ask for your OTP or PIN on the phone. Have a good day.", line_hi: "हम फ़ोन पर कभी OTP या PIN नहीं माँगते। आपका दिन शुभ हो।" },
      ],
    },
  ],
};
