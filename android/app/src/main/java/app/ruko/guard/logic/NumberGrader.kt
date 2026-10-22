package app.ruko.guard.logic

// Grades an incoming phone number green / yellow / orange / red, on the phone, with no network and no Android classes,
// so it is instant (a call screening service has about five seconds) and can be tested anywhere.
//
// It is a port of the web app's lib/numberRisk.ts and the grade rules in lib/line.ts. The shared test file
// android/test-vectors/number-vectors.csv is generated from the web code, so the two must agree.
//
// What it can and cannot see: the shape of the number (international, bank or promo series, short code), the carrier's
// caller-verification result, and anything the Ruko server told us about the number earlier. It cannot hear the call, and
// a spoofed or brand-new Indian mobile number looks like any other unknown mobile (yellow). It is a warning, not a guarantee.

enum class Grade { GREEN, YELLOW, ORANGE, RED;
    val word: String get() = name.lowercase()
}

enum class NumberKind { BANK_1600, PROMO_140, INTERNATIONAL, INDIAN_MOBILE, LANDLINE, SHORT_CODE, INVALID }

/** What the carrier says about the caller's number (Android's Call.Details caller-number verification). */
enum class Verification { NOT_VERIFIED, PASSED, FAILED }

data class Reports(val scam: Int = 0, val notScam: Int = 0)

data class NumberRisk(val normalized: String, val kind: NumberKind, val score: Int, val reasons: List<String>)

object NumberGrader {
    fun normalize(raw: String): String {
        val s = raw.trim().replace(Regex("[\\s()-]"), "")
        return when {
            Regex("^\\+\\d{6,15}$").matches(s) -> s
            Regex("^00\\d{6,15}$").matches(s) -> "+" + s.substring(2)
            Regex("^0[6-9]\\d{9}$").matches(s) -> "+91" + s.substring(1)
            Regex("^[6-9]\\d{9}$").matches(s) -> "+91$s"
            Regex("^(1600|140)\\d{6,7}$").matches(s) -> s
            Regex("^\\d{3,6}$").matches(s) -> s
            else -> s
        }
    }

    fun classify(n: String): NumberKind = when {
        Regex("^1600\\d{6}$").matches(n) || Regex("^\\+911600\\d{6}$").matches(n) -> NumberKind.BANK_1600
        Regex("^140\\d{7}$").matches(n) || Regex("^\\+91140\\d{7}$").matches(n) -> NumberKind.PROMO_140
        Regex("^\\d{3,6}$").matches(n) -> NumberKind.SHORT_CODE
        Regex("^\\+91[6-9]\\d{9}$").matches(n) -> NumberKind.INDIAN_MOBILE
        Regex("^\\+91\\d{10}$").matches(n) -> NumberKind.LANDLINE
        Regex("^\\+\\d{6,15}$").matches(n) -> NumberKind.INTERNATIONAL
        else -> NumberKind.INVALID
    }

    fun score(raw: String, inContacts: Boolean = false, reports: Reports = Reports(), verification: Verification = Verification.NOT_VERIFIED): NumberRisk {
        val normalized = normalize(raw)
        val kind = classify(normalized)
        val reasons = mutableListOf<String>()
        var score = 0

        if (inContacts) reasons += "in_contacts"
        else if (kind == NumberKind.INDIAN_MOBILE || kind == NumberKind.LANDLINE) {
            score += 10
            reasons += "not_in_contacts"
        }
        if (kind == NumberKind.INTERNATIONAL) {
            score += 35
            reasons += "international"
        }
        if (kind == NumberKind.BANK_1600) reasons += "bank_series"
        if (kind == NumberKind.PROMO_140) reasons += "promo_series"

        val net = reports.scam - reports.notScam
        if (reports.scam >= 3 && net > 0) {
            score += minOf(70, 40 + reports.scam * 2)
            reasons += "reported_many"
        } else if (reports.scam >= 1 && net > 0) {
            score += 25
            reasons += "reported_few"
        } else if (reports.notScam > reports.scam && reports.notScam >= 3) {
            score = maxOf(0, score - 15)
            reasons += "reported_safe"
        }

        // The carrier says the caller ID did not check out (a likely spoof): a reason to be careful. A PASS never lowers anything.
        if (verification == Verification.FAILED) {
            score += 35
            reasons += "unverified_caller"
        }

        if ((kind == NumberKind.BANK_1600 || inContacts) && "reported_many" !in reasons && "unverified_caller" !in reasons) score = minOf(score, 5)
        score = minOf(100, score)
        return NumberRisk(normalized, kind, score, reasons)
    }

    /** green only for a saved contact; every other number is at least yellow, so Ruko always checks first. */
    fun grade(risk: NumberRisk, inContacts: Boolean = false, blocked: Boolean = false): Grade = when {
        blocked -> Grade.RED
        "reported_many" in risk.reasons -> Grade.RED
        inContacts && risk.score < 30 -> Grade.GREEN
        risk.score >= 60 -> Grade.RED
        risk.score >= 30 -> Grade.ORANGE
        else -> Grade.YELLOW
    }
}
