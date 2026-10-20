// Consent notices (DPDP Rule 3: standalone, plain language, itemised data and
// purpose, withdrawal as easy as consent). One per purpose, English and Hindi.
// Changing any wording means bumping the version, so we know what each person agreed to.

export const CONSENT_NOTICE_VERSION = "v1-2026-10-09";

export type Purpose = "family_alerts" | "transaction_risk" | "call_signals" | "drills";

interface Notice {
  title: string;
  what: string;
  data: string;
  never: string;
  required: boolean;
}

export const NOTICES: Record<"en" | "hi", Record<Purpose, Notice>> = {
  en: {
    family_alerts: {
      title: "Tell my Ruko Family when I may be in danger",
      what: "When Ruko sees signs of a scam, or when you tap \"Tell my family\", the people you choose get an alert asking them to call you.",
      data: "Your name, your phone number, and the reason for the alert.",
      never: "They never see your calls, messages, bank balance or location.",
      required: true,
    },
    transaction_risk: {
      title: "Check my payments for scam signs",
      what: "Ruko checks large or unusual payments and pauses risky ones, so your family or bank can check them first.",
      data: "The amount, who you are paying, and when.",
      never: "Ruko never moves your money and never sees your PIN or OTP.",
      required: true,
    },
    call_signals: {
      title: "Know when I am on a long call with an unknown number",
      what: "Only on the Ruko Android app: Ruko notices that a long call with an unknown number is happening, and pauses risky payments during it.",
      data: "That a call is happening and how long it has lasted.",
      never: "Ruko never records or listens to your calls, and never sees who is calling or what is said.",
      required: false,
    },
    drills: {
      title: "Send me practice scam calls",
      what: "Short practice calls help you recognise the real thing. Say \"RUKO\" at any time and the practice stops at once.",
      data: "Whether you stopped the practice scam, and how long it took.",
      never: "Practice calls never ask for a real OTP, PIN or Aadhaar number, and no real money ever moves.",
      required: false,
    },
  },
  hi: {
    family_alerts: {
      title: "खतरे में होने पर मेरे Ruko परिवार को बताएँ",
      what: "जब Ruko को धोखे के संकेत दिखें, या आप \"परिवार को बताएँ\" दबाएँ, तो आपके चुने हुए लोगों को आपको फ़ोन करने का अलर्ट जाएगा।",
      data: "आपका नाम, फ़ोन नंबर और अलर्ट का कारण।",
      never: "वे कभी आपकी कॉल, मैसेज, बैंक बैलेंस या लोकेशन नहीं देखते।",
      required: true,
    },
    transaction_risk: {
      title: "मेरे भुगतानों में धोखे के संकेत जाँचें",
      what: "Ruko बड़े या अनोखे भुगतान जाँचता है और खतरनाक भुगतान रोक देता है, ताकि पहले आपका परिवार या बैंक उन्हें देख सके।",
      data: "रकम, किसे भेज रहे हैं, और कब।",
      never: "Ruko कभी आपका पैसा नहीं भेजता और कभी आपका PIN या OTP नहीं देखता।",
      required: true,
    },
    call_signals: {
      title: "जानें कि मैं किसी अनजान नंबर से लंबी कॉल पर हूँ",
      what: "सिर्फ़ Ruko Android ऐप में: Ruko देखता है कि किसी अनजान नंबर से लंबी कॉल चल रही है, और उस दौरान खतरनाक भुगतान रोकता है।",
      data: "कि कॉल चल रही है और कितनी देर से।",
      never: "Ruko कभी आपकी कॉल रिकॉर्ड नहीं करता, न सुनता है, न देखता है कि कौन फ़ोन कर रहा है या क्या कहा गया।",
      required: false,
    },
    drills: {
      title: "मुझे अभ्यास के लिए नकली धोखे वाली कॉल भेजें",
      what: "छोटी अभ्यास कॉल असली धोखे को पहचानने में मदद करती हैं। कभी भी \"RUKO\" बोलें, अभ्यास तुरंत रुक जाएगा।",
      data: "आपने अभ्यास वाला धोखा रोका या नहीं, और कितने समय में।",
      never: "अभ्यास कॉल कभी असली OTP, PIN या आधार नंबर नहीं माँगती, और कोई असली पैसा नहीं जाता।",
      required: false,
    },
  },
};

export const PURPOSES: Purpose[] = ["family_alerts", "transaction_risk", "call_signals", "drills"];
