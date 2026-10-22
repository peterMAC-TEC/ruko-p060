package app.ruko.guard

import android.content.Context
import app.ruko.guard.logic.AlertPayload
import app.ruko.guard.logic.AlertQueue
import app.ruko.guard.logic.Decision
import app.ruko.guard.logic.Grade
import app.ruko.guard.logic.NumberGrader
import app.ruko.guard.logic.ScreenAction
import app.ruko.guard.logic.Verification
import java.time.Instant

// What happens for each incoming call: grade the number (on the phone first, then a quick ask to the Ruko server, with an
// answer remembered for next time), decide, warn, and, for orange and red, tell the family. All of it is a few hundred
// milliseconds, and it never touches the call itself: no audio, no recording.
object ScreeningCore {
    data class Outcome(val action: ScreenAction, val grade: Grade, val reasons: List<String>, val numberHash: String?)

    private val order = listOf(Grade.GREEN, Grade.YELLOW, Grade.ORANGE, Grade.RED)
    private fun worse(a: Grade, b: Grade) = if (order.indexOf(a) >= order.indexOf(b)) a else b

    /** Grade and decide. `inContacts` is false for every call the system hands the call-screening role (it skips saved contacts). */
    fun screen(context: Context, number: String, verification: Verification, serverTimeoutMs: Int = 1500): Outcome {
        val prefs = Prefs(context)
        val now = System.currentTimeMillis()
        val local = NumberGrader.score(number, inContacts = false, verification = verification)
        var grade = NumberGrader.grade(local)
        var reasons = local.reasons
        var hash: String? = null

        // What the server knows (community reports): remembered for 24 hours so a repeat call is instant.
        val key = local.normalized
        val cached = prefs.cachedLookup(key, now)
        val lookup = if (cached != null) RukoApi.Lookup(cached.score, cached.reasons, cached.hash) else RukoApi.lookup(number, serverTimeoutMs)
        if (lookup != null) {
            if (cached == null) prefs.cacheLookup(key, Prefs.Cached(lookup.score, lookup.reasons, lookup.hash, now))
            hash = lookup.hash
            val serverGrade = when {
                "reported_many" in lookup.reasons -> Grade.RED
                lookup.score >= 60 -> Grade.RED
                lookup.score >= 30 -> Grade.ORANGE
                else -> Grade.YELLOW
            }
            grade = worse(grade, serverGrade)
            reasons = (reasons + lookup.reasons).distinct()
        }

        val action = Decision.decide(grade, inContacts = false, blockTheWorst = prefs.blockTheWorst)
        return Outcome(action, grade, reasons, hash)
    }

    /** After the call has been answered for: warn the person, remember it, and tell the family if the grade says so. */
    fun afterDecision(context: Context, outcome: Outcome) {
        val prefs = Prefs(context)
        val silenced = outcome.action == ScreenAction.SILENCE_AND_WARN || outcome.action == ScreenAction.REJECT_AND_WARN
        val rejected = outcome.action == ScreenAction.REJECT_AND_WARN
        if (outcome.grade != Grade.GREEN) {
            Notifier.warn(context, outcome.grade, silenced, rejected, prefs.ruleEn)
            prefs.addWarning(Prefs.Warning(System.currentTimeMillis(), outcome.grade.word, outcome.reasons.take(4)))
        }
        if (Decision.shouldTellFamily(outcome.grade, inContacts = false) && prefs.paired) {
            val reasons = if (silenced) outcome.reasons + "ring_silenced" else outcome.reasons
            val payload = AlertPayload.build(prefs.elderId!!, outcome.grade, reasons, outcome.numberHash, Instant.now().toString())
            val now = System.currentTimeMillis()
            AlertQueue.enqueue(prefs.queue, payload, now)
            flushQueue(context)
        }
    }

    /** Send any waiting alerts (also called when the app is opened). Runs off the main thread. */
    fun flushQueue(context: Context) {
        val prefs = Prefs(context)
        val token = prefs.token ?: return
        Thread {
            AlertQueue.flush(prefs.queue, System.currentTimeMillis()) { RukoApi.sendAlert(it, token) }
        }.start()
    }
}
