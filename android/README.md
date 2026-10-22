# Ruko Guard: the Android call-screening app

A small native Android app (Kotlin, no libraries) that grades an incoming number **before the phone rings** and warns the person, and for a risky number silently tells the family through Ruko. This is Layer 2 of three: setup (the web app's `/setup`), screening (this app), the family alert (`/api/alerts/risk`).

## Read this first: what is and is not proven

| | Status |
|---|---|
| The grading, the decision rules, the alert payload, the offline queue and the pairing code (`app/src/main/java/app/ruko/guard/logic/`) | **Compiled and tested on a computer: 30 checks pass**, including the same grade as the web app for 30 test numbers |
| The Android parts (the screening service, the one screen, notifications, networking) | **Written, not compiled, not run on any phone.** This computer had no Android SDK. Expect small fix-ups the first time you build. |
| The web side (`/api/alerts/risk`, `/api/device/rule-card`, the pairing code) | Built and tested against the running app |
| A real call, end to end, on a real phone | **Not tested.** |

## What it does, in one breath

On an incoming call from a number not in your contacts, Ruko Guard reads the number and the carrier's caller-ID check, asks the Ruko server how risky the number is (1.5 seconds at most, remembered for a day), and decides:

- **green** (a saved contact): rings normally. (With the standard role the system is meant to skip saved contacts anyway.)
- **yellow** (unknown): rings, with a quiet "be careful" note.
- **orange** or **red**: **silences the ring** and shows a large "Do not pay anyone on this call" warning. The person can still answer. Red is **rejected** only if "Block the worst calls" is on (it is off by default).
- **orange and red** also tell the family (the trusted person gets a Ruko alert with a "call now" button), using **only a risk level, reason codes and a hash of the number**.

It never uses call audio, never records, and asks for **only** the standard call-screening role and the notification permission (plus internet). It does **not** ask for contacts, call log, phone state, microphone, overlay, accessibility, notification-listener or usage access.

## Honest limits (also shown in the app)

- It grades **numbers**. A spoofed number, or a brand-new Indian mobile number, usually grades **yellow**, not red. It is a warning layer, not a guarantee.
- It cannot talk to the caller and cannot hear the call.
- The system hands the call-screening app only calls from numbers **not in the contacts** (this is the owner's research; **not verified on a device**). If a contact's call ever reached the app, the code still never silences it, but the app has no contacts permission to check, so test this.
- To check a number, the app sends that number to the Ruko server (as the web number check does). Only codes and a hash go to the family.
- Alerts need a signal: with none, they wait (up to 10, for 30 minutes) and go out when the app next runs or the phone is back online. There is no background retry service yet.
- The Ruko app on the family's phone only shows the alert when it is open. **Real push notifications to a closed phone are not built.**

## Build and install, one step at a time

You need Android Studio (free) and a phone with Android 10 or newer.

1. Install **Android Studio** from developer.android.com/studio.
2. Open Android Studio, choose **Open**, and pick this folder: `android/`.
3. Wait while it "syncs" (it downloads what it needs; this can take several minutes). If it offers to **create the Gradle wrapper**, say yes.
4. On your phone: **Settings, About phone**, tap **Build number** 7 times to turn on developer options. Then **Developer options**, switch on **USB debugging**.
5. Plug the phone into the computer, tap **Allow** on the phone.
6. In Android Studio press the green **Run** button. The app "Ruko Guard" installs and opens.
7. Tap **Turn Ruko on**, choose **Ruko Guard**, tap **Set as default**.
8. Get a pairing code: the trusted family member opens the Ruko web app's **/setup**, step 1, taps **Optional: the Ruko Guard Android app**, then **Show the pairing code**. Copy it, paste it into the Android app, and tap **Pair this phone**.
9. Ask someone to call you from a number not in your contacts. Try an international number too.

To check the logic on its own, with no phone: install a JDK (17) and the Kotlin compiler, then from this folder:

```
kotlinc app/src/main/java/app/ruko/guard/logic/*.kt app/src/test/java/app/ruko/guard/LogicSelfTest.kt -include-runtime -d selftest.jar
java -jar selftest.jar test-vectors/number-vectors.csv
```

It should print `all 30 Android logic checks passed`.

## Keeping the grading in step with the web app

`test-vectors/number-vectors.csv` is generated from the web app's own grader (`app/lib/numberRisk.ts`, `app/lib/line.ts`):

```
npx tsx scripts/gen-android-vectors.ts          # regenerate
npx tsx scripts/gen-android-vectors.ts --check  # fails if the file is out of date
```

If the web grader changes, regenerate the file; the Kotlin test then shows exactly what to update.

## Where things are

- `app/src/main/java/app/ruko/guard/logic/`: the pure rules (no Android).
- `RukoScreeningService.kt`: the system call-screening service.
- `ScreeningCore.kt`: grade, decide, warn, tell the family.
- `RukoApi.kt`: the two server calls and the pairing check.
- `MainActivity.kt`: the one screen. `Notifier.kt`: the warning. `Prefs.kt`: what is remembered on the phone.
