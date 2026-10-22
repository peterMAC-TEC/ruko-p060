package app.ruko.guard.logic

// The one message the app sends to Ruko about a risky call: a risk level, reason codes and, if the server gave us one, a hash
// of the number. NEVER audio, never words from a call, never the phone number itself. The server rejects anything else
// (its alert body is strict), and this builder cannot produce anything else.

object AlertPayload {
    /** Reason codes the server knows (lib/risk-alert.ts). Anything else is dropped here too. */
    val ALLOWED_REASONS = setOf(
        "not_in_contacts", "international", "reported_many", "reported_few", "bank_series", "promo_series",
        "blocked_before", "short_code", "unverified_caller", "ring_silenced",
    )

    private val HASH = Regex("^[a-f0-9]{64}$")

    fun build(elderId: String, grade: Grade, reasonCodes: List<String>, numberHash: String?, atIso: String): String {
        val codes = reasonCodes.filter { it in ALLOWED_REASONS }.distinct().take(8)
        val sb = StringBuilder("{")
        sb.append("\"elderId\":").append(q(elderId))
        sb.append(",\"riskLevel\":").append(q(grade.word))
        sb.append(",\"reasonCodes\":[").append(codes.joinToString(",") { q(it) }).append("]")
        if (numberHash != null && HASH.matches(numberHash)) sb.append(",\"numberHash\":").append(q(numberHash))
        sb.append(",\"source\":\"android\"")
        sb.append(",\"at\":").append(q(atIso))
        sb.append("}")
        return sb.toString()
    }

    private fun q(s: String): String {
        val out = StringBuilder("\"")
        for (c in s) when (c) {
            '"' -> out.append("\\\"")
            '\\' -> out.append("\\\\")
            '\n' -> out.append("\\n")
            '\r' -> out.append("\\r")
            '\t' -> out.append("\\t")
            else -> if (c < ' ') out.append(' ') else out.append(c)
        }
        return out.append('"').toString()
    }
}
