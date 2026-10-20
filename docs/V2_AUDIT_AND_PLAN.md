# Ruko v2: audit, platform reality report and build plan

*9 Oct 2026. This responds to `ADVANCEMENT_PROMPT_V2.md` §5, steps 1–3. **Nothing that needs a risky permission is built until the user approves.***

---

## 1. Audit: what exists, what's broken, what overlaps

Ruko today is a **Next.js web app (PWA-ready)** with a Supabase database in Mumbai. It is not a native phone app, so it cannot see real calls.

### Already built, mapped to v2

| v2 item | What exists | Gap |
|---|---|---|
| **Guided "Is this a scam?" check** | `/check`: one question per screen, read aloud in English/Hindi, voice "haan/nahin", conclusive answers stop early. Scored in `lib/callcheck.ts` (9 tests) | Questions differ from v2's five. v2 wants "2 or more yes → STOP". Not floating during a call (web can't be) |
| **STOP screen** | The verdict screen names the scam, states the fixed fact ("Digital arrest does not exist…"), gives numbered steps and a 1930 button | v2 wants full-screen red-amber with exactly three actions: **Hang up / Call trusted person / I'm not sure** |
| **Pattern library** | 4 patterns in code: digital arrest, courier, TRAI, bank, plus EN/HI phrase matching | 6 of v2's 10 patterns are missing. **Not remote config**: patterns are hard-coded |
| **Pre-call risk check** | Nothing | No number scoring, no community reports, no call detection |
| **Listen mode** | Nothing (by design: "signals, not audio") | See platform report: **likely impossible** for normal apps |
| **Money Lock** | **Bank-side** version: risky payments held, with a 1-hour cooling-off (RBI proposal), a **hold that follows the elder** across UPI/NEFT/cash/FD, **trusted-person approval** for ₹50k+ at age 70+, and the fraud desk. Works only inside the practice bank | v2's Money Lock is **on-device**: it reacts when *any* payment app opens after a risky call |
| **Family Shield** | **Ruko Family**: up to 3 people, invite-and-accept (DPDP), trusted person, code word, **silent "Tell my family"**, alerts with a "What to say" script, approvals, "they're safe" clear | Alerts arrive **only while the family page is open**. No push notifications yet |
| **"I've been scammed" flow** | Nothing | Golden-hour steps and the prefilled report are missing |
| **Post-call "Was this a scam?"** | Nothing | Missing, and it's needed for the false-positive rate |
| **Onboarding** | `/start`: role, profile, 4 separate consents (DPDP, EN/HI), teach-back | Probably takes **2–3 minutes**; v2 wants under 90 seconds |
| **Settings / delete my data** | Consent withdrawal API only | No settings screen and no "delete my data" |
| **Metrics** | Nothing anonymous | Scams flagged, Money Lock triggers, payments abandoned, false-positive reports and time-to-warning are all missing |

### Broken or weak today
1. **Call signals are simulated.** A demo panel fakes "on a call with an unknown number". No real device feeds them.
2. **Real sign-in hasn't been tested end to end.** The Supabase URL settings still need to be set, and the user needs to do a real sign-up.
3. **Family alerts don't reach a closed phone.** There's no push and no Realtime; the app polls instead.
4. **The secret key needs rotating** before anything goes online (it was pasted in chat).
5. **Not deployed.** Tests are scripts only (26 cases), with no end-to-end tests.
6. **Only English and Hindi.**
7. **The hackathon's own north star isn't built yet:** consented scam drills plus the measured stop rate (simulator and results).

### Where v2 conflicts with earlier decisions (needs your call)
- **v2 says dashboards and everything else are out of scope**, but the **ForgeX brief requires a measured stop rate from role-played drills with 10 elders**. That is how P060 is judged. *Recommendation: keep a minimal drill plus results page for the hackathon only.*
- **Pre-call number scoring is Truecaller's core strength.** It has hundreds of millions of users reporting numbers, and its family feature is free. Ruko's community database starts empty. *Recommendation: build it, but expect a weak signal at first. Lean on number patterns (international, not in contacts, new) and on what happens during the call, which Truecaller can't see.*
- **Name clash:** v2's "Money Lock" overlaps the blueprint's "Ruko Lock" (a savings lock). *Recommendation: v2's on-device feature takes the name **Money Lock**; the savings lock is dropped or folded into it.*
- **Business model:** v2 describes a consumer app; the blueprint said banks pay. These fit together: the consumer app is the product, and banks can distribute and pay later. No change is needed now.

---

## 2. Platform reality report

**Risk key:**
- 🟢 **Low:** normal permission or role, routine store review.
- 🟡 **Medium:** a special permission or declaration; it can pass with a clear in-app explanation, but review can push back.
- 🔴 **High:** likely rejection or a technical dead end.

### Android

| Capability | How | Technically possible? | Store/policy risk |
|---|---|---|---|
| **Pre-call risk check** | **CallScreeningService** with the user-granted **call-screening role** (Android 10+). It sees incoming calls from numbers *not in contacts* before they ring, can label, silence or block, and must respond **within 5 seconds** (use a local cache) | ✅ Yes. But **Ruko can't change the system incoming-call screen**; only the default dialer controls it. The label shows as Ruko's own heads-up notification at ring time | 🟢 No restricted permission. Avoid `READ_CALL_LOG` (restricted; needs the caller-ID exception declaration) |
| **Know a call is in progress** | `READ_PHONE_STATE` call-state callback (idle, ringing, off-hook) | ✅ For SIM calls. **WhatsApp/VoIP calls aren't reported** (the audio mode can hint, unreliably) | 🟢 Runtime permission, not restricted |
| **In-call "Is this a scam?" button** | (a) **Ongoing notification with an action button** while an unknown-number call is active; (b) a **floating overlay** using `SYSTEM_ALERT_WINDOW` | ✅ Both | (a) 🟢. (b) 🟡 a special permission the user must turn on in Settings; Play wants it tied to a core feature. Malware uses overlays, so expect scrutiny |
| **Listen mode (speakerphone + mic)** | Record the mic while a call is active | ❌ **Very likely impossible.** Since Android 10, the system **silences the mic for non-privileged apps while another capture (the call) is active**. Users of call-recorder apps report files that are pure silence | 🔴 Play has also banned third-party call recording since 2022. **Recommend dropping it.** Replace with the existing "Tell me what they said" check, done after hanging up or with the caller on hold |
| **Money Lock: detect a payment app opening** | **Usage access** (`PACKAGE_USAGE_STATS`, a special permission granted in Settings) plus a foreground service, polling which app is in front | ✅ About 1–2 seconds of delay | 🟡 Special permission, must be promoted in the listing with a fallback if declined. On Android 14+ a foreground service needs a declared type (likely "specialUse", with a Play declaration) |
| **Money Lock: show the lock screen over the payment app** | `SYSTEM_ALERT_WINDOW` overlay (or a full-screen-intent notification) | ✅ With the overlay | 🟡 Overlay as above. 🔴 Full-screen intent: since Android 14 only **calling and alarm apps** get it by default; Ruko would rely on the user granting it manually |
| **Money Lock: via AccessibilityService** | Watch the screen of other apps | ✅ Technically | 🔴 **Play says anti-fraud and monitoring apps are *not* accessibility tools**, so it needs a declaration form plus a video, and "autonomous actions" are banned. **Android 16 blocks granting accessibility during calls with unknown numbers.** Many Indian banking apps refuse to run while an unknown accessibility service is on. **Recommend not using it** |
| **Money Lock: clipboard (copied UPI ID)** | Read the clipboard in the background | ❌ Since Android 10, only the foreground app or the default keyboard can read it | 🔴 Dead end |
| **Money Lock: QR scan detection** | Intercept another app's camera | ❌ Not possible | Dead end |
| **"Money sent" detection (for the golden hour)** | Notification listener reads the payment app's confirmation notification | ✅ But only *after* payment, so it suits the emergency flow, not prevention | 🟡 Special access. **Restricted for sideloaded apps on Android 13+** |
| **Family alerts when the app is closed** | Firebase Cloud Messaging push | ✅ | 🟢 Free |
| **Offline core protection** | Cache the pattern library plus recent risky numbers on the device | ✅ | 🟢 |
| **Background operation** | Call screening runs on demand (no service needed). Money Lock watching needs a foreground service only during a 30-minute "risk window" after a risky call | ✅ | 🟡 Foreground service type declaration (Android 14+) |
| **Distribution for the trials** | Play internal testing (needs a **Play developer account, US$25 one-time ≈ ₹2,100**) or sideloading an APK (free) | ✅ | Sideloaded apps hit Android 13+ "restricted settings" for some permissions, and Play Protect may warn. Internal testing avoids this |

### iOS

| Capability | How | Technically possible? | Store/policy risk |
|---|---|---|---|
| **Pre-call risk label** | **Call Directory extension** (a static list labelled on the incoming call screen, works offline) plus **Live Caller ID Lookup** (iOS 18+: a real-time, privacy-preserving server lookup; Truecaller uses it) | ✅ The label appears **on the system incoming-call screen** (better than Android here) | 🟡 Live Caller ID needs an **Apple-approved entitlement** and a privacy-preserving lookup server. The Call Directory is 🟢 |
| **Know a call is in progress** | `CXCallObserver` | ⚠️ Only while Ruko is running. No number, and nothing about WhatsApp | 🟢 But not reliable in the background |
| **In-call floating button** | Not possible; iOS has no overlays | ❌ | The nearest option is a **Lock Screen/Home widget or Control Center control** opening "Is this a scam?" (🟢) |
| **Listen mode** | Not possible | ❌ | 🔴 |
| **Money Lock** | **Screen Time API** (FamilyControls, individual authorization, iOS 16+): **shield** the payment apps the user picks, so opening them shows Ruko's lock screen. Triggered when the user taps "Lock my payment apps" on the STOP screen, then unlocks after the cool-down or with family | ✅ But it **can't trigger automatically from a call**, since iOS can't tell Ruko a risky call happened in the background | 🟡 Needs Apple's **Family Controls distribution entitlement** (reports say **~4–5 weeks** of review). Apps are referenced by opaque tokens |
| **Shortcuts automation** | "When GPay opens → show Ruko" personal automation | ✅ Only if the user sets it up themselves | 🟢 But too fiddly for elders |
| **Family alerts** | Apple push notifications | ✅ | 🟢 Needs an Apple developer account (**US$99/yr**) |
| **Distribution** | TestFlight | ✅ | Needs the developer account. **Native iOS is out of scope before 28 Oct**; iPhone users get the web version (check, STOP, family, emergency) |

### What could get Ruko rejected
1. **AccessibilityService** for anti-fraud: high risk. **Don't use it.**
2. **Call recording or listen mode:** banned on Play and technically silenced. **Don't build it.**
3. **`READ_CALL_LOG` / SMS permissions** without a strong caller-ID declaration: avoid; use the call-screening role.
4. **Continuous monitoring of an adult that reports to family:** Play's stalkerware policy. Alerts must stay **risk-event or user-triggered**, as now.
5. **Overlay plus usage access together** look like malware patterns. These need a clear in-app explanation, a demo video in the Play declaration, and Money Lock promoted in the store listing.
6. **iOS entitlements** (Live Caller ID, Family Controls) take weeks, so they can't be ready for 28 Oct.

---

## 3. Phased build plan (deadline 28 Oct; trials ~20–25 Oct)

### Phase 0: shared foundation (web; no risky permissions), ~1.5 days
- **Pattern library as remote config:** all **10 v2 patterns** (digital arrest/fake police, courier drugs, KYC/account block, electricity cut-off, fake customer care, voice-clone family emergency, investment/task/trading, sextortion video call, loan-app harassment, OTP/screen-share apps). Each has signals in EN/HI, a one-line rule, an explanation and a version. Served from `/api/patterns`, cached offline.
- **v2 guided check:** the five v2 questions (stay on call / pay to avoid arrest / install an app / share an OTP / keep it secret). **Two or more "yes" → STOP**, naming the scam.
- **STOP screen to spec:** full-screen red-amber, the scam named, the one rule broken, and three actions: **Hang up / Call trusted person / I'm not sure** (3-line explanation).
- **Number risk API plus community reports:** a `number_reports` table and a scoring function (pattern of the number, report count, recency, whether it's in contacts), plus the post-call "Was this a scam?" screen feeding it.
- **"I've been scammed" emergency flow:** golden-hour steps, one-tap 1930, cybercrime.gov.in, a bank-freeze call script, Chakshu, and a **prefilled shareable report** (number, time, amount, scam type).
- **Anonymous metrics:** an `events` table with no personal data, recording scams flagged, Money Lock triggers, payments abandoned (and the amount = "money saved"), false-positive reports, and trigger-to-warning time.
- Tests for all of it.

### Phase 1: Scam Radar on Android, ~4 days
An **Expo (React Native) app with a small Kotlin module**, reusing the same API and screens:
- **Call-screening role:** pre-call risk from the cached list plus the API, shown as a heads-up label in under 5 seconds.
- **Call state:** during an unknown-number call, an **ongoing notification with "Is this a scam?"** opens the check and STOP.
- **After the call:** the "Was this a scam?" prompt.
- Push notifications for family alerts.

### Phase 2: Money Lock on Android, ~3 days (needs your approval)
- During the **30-minute risk window** after a flagged call, the app watches which app is in front (**usage access**). When a payment app opens, it shows **Money Lock over it (overlay)**: the reason, a **10-minute cool-down** (adjustable), and **"Call my trusted person first"**. The family is alerted.
- Fallback if the overlay is declined: a high-priority notification.
- **Bank-side Money Lock already exists** (hold, trusted person, fraud desk) for partner banks, at zero platform risk.

### Phase 3: Family Shield plus recovery, ~2 days
- Push alerts to trusted contacts on a risky call or a Money Lock trigger.
- The emergency flow linked from everywhere.
- Optionally, "money sent" detection through the notification listener to start the golden-hour flow (needs approval).

### Phase 4: Listen mode. **Recommend not building it.**
The mic is silenced during calls on modern Android, and call recording is banned on Play. Offer a **1-day spike on your Android phone** to prove it either way if you want. The replacement is the existing "Tell me what they said" check.

### Hackathon extra (recommended), ~2 days
- A minimal **consented drill** (fictional "Central Investigation Cell – DRILL") plus a **results page** (furthest step reached, false alarms). It's needed for P060's north star.

**Total:** about 12.5–14.5 days of build inside 19 days, run in parallel with trials. It's tight. If time runs short, cut Phase 3's notification listener, then the overlay (fall back to the notification).

---

## 4. Decisions needed before building
1. **Approve or reject each risky permission:**
   - overlay (`SYSTEM_ALERT_WINDOW`) 🟡
   - usage access 🟡
   - notification listener 🟡
   - **No** accessibility 🔴
   - **No** listen mode 🔴
2. **Build the native Android app now** (Expo + Kotlin)? iPhone users get the web version until after the hackathon.
3. **Trial distribution:** a Play developer account (US$25 ≈ ₹2,100, over the ₹2,000 budget) or a sideloaded APK (free, more setup friction for elders).
4. **Keep the minimal drill plus results page** for the hackathon's north star, even though v2 puts dashboards out of scope?

## Sources
- [Android concurrent audio capture (AOSP)](https://source.android.com/docs/core/audio/concurrent)
- [Android 10 call recordings silent (Fairphone forum)](https://forum.fairphone.com/t/after-android-10-update-call-recording-only-records-silence/64604)
- [Play call-recording ban (TechRadar)](https://www.techradar.com/news/new-google-play-store-policy-cracks-down-on-call-recording-apps)
- [Play Accessibility API policy](https://support.google.com/googleplay/android-developer/answer/10964491?hl=en)
- [Android screen calls (CallScreeningService)](https://developer.android.com/develop/connectivity/telecom/dialer-app/screen-calls?hl=en)
- [Play sensitive permissions policy](https://support.google.com/googleplay/android-developer/answer/9888170?authuser=3)
- [Play special permissions guidance](https://support.google.com/googleplay/android-developer/answer/16585319)
- [Full-screen intent limits (AOSP)](https://source.android.google.cn/docs/core/permissions/fsi-limits?hl=zh-tw)
- [Play foreground service and full-screen intent requirements](https://support.google.com/googleplay/android-developer/answer/13392821)
- [Android 10 privacy changes (clipboard)](https://developer.android.com/about/versions/10/privacy/changes)
- [Microsoft on clipboard access](https://www.microsoft.com/en-us/security/blog/?p=126288)
- [Truecaller real-time caller ID on iOS 18](https://www.idropnews.com/news/truecaller-app-launches-real-time-caller-id-and-automated-spam-call-blocking-for-ios/238274)
- [Live Caller ID entitlement (Apple forums)](https://developer.apple.com/forums/thread/763776)
- [Screen Time API (WWDC22)](https://developer.apple.com/videos/play/wwdc2022/110336?time=192)
- [Family Controls entitlement wait times](https://developer.apple.com/forums/thread/765074)
- Research file `docs/research/04-law-and-platforms.md` (Play stalkerware policy, Android 16 sideloading and accessibility limits, DPDP)
