package app.ruko.guard

import app.ruko.guard.logic.AlertPayload
import app.ruko.guard.logic.AlertQueue
import app.ruko.guard.logic.Decision
import app.ruko.guard.logic.Grade
import app.ruko.guard.logic.NumberGrader
import app.ruko.guard.logic.PairingCode
import app.ruko.guard.logic.QueueStore
import app.ruko.guard.logic.Reports
import app.ruko.guard.logic.ScreenAction
import app.ruko.guard.logic.Verification
import java.io.File

// The checks for the logic that decides what Ruko does with a call. No Android needed. They run two ways:
//   1. under JUnit (LogicTest.kt calls run(), in Android Studio or `gradlew test`)
//   2. as a plain program: kotlinc the logic files and this file, then `java -jar` (see android/README.md)
// The grading checks read android/test-vectors/number-vectors.csv, which is generated from the WEB app's own grader.

object LogicSelfTest {
    private var n = 0

    private fun ok(name: String, cond: Boolean) {
        check(cond) { "FAILED: $name" }
        n++
        println("ok  $name")
    }

    class MemStore : QueueStore {
        var items: List<Pair<Long, String>> = emptyList()
        override fun read() = items
        override fun write(items: List<Pair<Long, String>>) {
            this.items = items
        }
    }

    fun run(vectorsPath: String): Int {
        n = 0

        // ---- the same grade as the web app, for every vector
        val lines = File(vectorsPath).readLines().filter { it.isNotBlank() && !it.startsWith("#") }
        var mismatches = 0
        for (line in lines) {
            val f = line.split(",")
            val number = f[0].removeSurrounding("\"")
            val inContacts = f[1].toBoolean()
            val scam = f[2].toInt()
            val notScam = f[3].toInt()
            val blocked = f[4].toBoolean()
            val expectedNormalized = f[5]
            val expectedKind = f[6]
            val expectedScore = f[7].toInt()
            val expectedGrade = f[8]
            val risk = NumberGrader.score(number, inContacts, Reports(scam, notScam))
            val grade = NumberGrader.grade(risk, inContacts, blocked)
            val same = risk.normalized == expectedNormalized && risk.kind.name.lowercase() == expectedKind && risk.score == expectedScore && grade.word == expectedGrade
            if (!same) {
                mismatches++
                println("  MISMATCH for $number: got ${risk.normalized}/${risk.kind}/${risk.score}/${grade.word}, expected $expectedNormalized/$expectedKind/$expectedScore/$expectedGrade")
            }
        }
        ok("the Kotlin grader gives the web app's number, kind, score and grade for all ${lines.size} test vectors", mismatches == 0)

        // ---- grades
        fun g(num: String, contacts: Boolean = false, scam: Int = 0, v: Verification = Verification.NOT_VERIFIED) = NumberGrader.grade(NumberGrader.score(num, contacts, Reports(scam), v), contacts)
        ok("a saved contact is green", g("+919845000002", contacts = true) == Grade.GREEN)
        ok("an unknown Indian mobile is yellow, never green", g("+919800000000") == Grade.YELLOW)
        ok("an international number is orange", g("+4412345678901") == Grade.ORANGE)
        ok("a number many people reported is red", g("+919800000000", scam = 5) == Grade.RED)
        ok("a failed caller-ID check raises the grade to orange", g("+919800000000", v = Verification.FAILED) == Grade.ORANGE)
        ok("a passed caller-ID check never lowers a grade", g("+4412345678901", v = Verification.PASSED) == Grade.ORANGE)
        ok("a 1600 number is yellow, because anyone can fake it", g("1600123456") == Grade.YELLOW)

        // ---- what Ruko does
        ok("green rings normally", Decision.decide(Grade.GREEN, false, false) == ScreenAction.ALLOW)
        ok("yellow rings, with a care note", Decision.decide(Grade.YELLOW, false, false) == ScreenAction.ALLOW_WITH_CARE_NOTE)
        ok("orange is silenced and warned", Decision.decide(Grade.ORANGE, false, false) == ScreenAction.SILENCE_AND_WARN)
        ok("red is silenced and warned by default (blocking is off)", Decision.decide(Grade.RED, false, false) == ScreenAction.SILENCE_AND_WARN)
        ok("red is rejected only when the person turned on 'block the worst'", Decision.decide(Grade.RED, false, true) == ScreenAction.REJECT_AND_WARN)
        ok("orange is never rejected, even with blocking on", Decision.decide(Grade.ORANGE, false, true) == ScreenAction.SILENCE_AND_WARN)
        ok("a number in the contacts is never silenced or blocked, at any grade", Grade.values().all { Decision.decide(it, true, true) == ScreenAction.ALLOW })
        ok("only orange and red tell the family", Decision.shouldTellFamily(Grade.ORANGE, false) && Decision.shouldTellFamily(Grade.RED, false) && !Decision.shouldTellFamily(Grade.YELLOW, false) && !Decision.shouldTellFamily(Grade.GREEN, false))
        ok("a contact never tells the family", Grade.values().none { Decision.shouldTellFamily(it, true) })

        // ---- the alert: codes and a hash only
        val hash = "a".repeat(64)
        val json = AlertPayload.build("11111111-2222-4333-8444-555555555555", Grade.RED, listOf("international", "reported_many", "a secret", "international"), hash, "2026-10-22T10:00:00Z")
        ok("the alert has exactly the fields the server accepts", Regex("^\\{\"elderId\":\"[^\"]+\",\"riskLevel\":\"red\",\"reasonCodes\":\\[[^\\]]*\\],\"numberHash\":\"[a-f0-9]{64}\",\"source\":\"android\",\"at\":\"[^\"]+\"\\}$").matches(json))
        ok("unknown reason codes are dropped and repeats removed", json.contains("\"reasonCodes\":[\"international\",\"reported_many\"]"))
        ok("the alert never contains audio, a transcript or a phone number", !Regex("transcript|audio|said|\\+?\\d{10,}").containsMatchIn(json.replace(hash, "").replace("11111111-2222-4333-8444-555555555555", "").replace("2026-10-22T10:00:00Z", "")))
        ok("a bad hash is left out rather than sent", !AlertPayload.build("e", Grade.ORANGE, emptyList(), "+919845000002", "t").contains("numberHash"))
        ok("quotes in a value cannot break the JSON", AlertPayload.build("a\"b", Grade.ORANGE, emptyList(), null, "t").contains("a\\\"b"))

        // ---- the offline queue
        val store = MemStore()
        val t0 = 10_000_000L
        AlertQueue.enqueue(store, json, t0)
        AlertQueue.enqueue(store, json, t0)
        ok("an alert waits offline, and the same one is not queued twice", AlertQueue.load(store, t0).size == 1)
        ok("nothing is lost if sending still fails", AlertQueue.flush(store, t0) { false } == 0 && AlertQueue.load(store, t0).size == 1)
        ok("a send that throws is kept, not lost", AlertQueue.flush(store, t0) { throw RuntimeException("offline") } == 0 && AlertQueue.load(store, t0).size == 1)
        ok("an old waiting alert expires", AlertQueue.load(store, t0 + AlertQueue.MAX_AGE_MS + 1).isEmpty())
        ok("it goes out when the signal is back, and the queue empties", AlertQueue.flush(store, t0) { true } == 1 && AlertQueue.load(store, t0).isEmpty())
        val big = MemStore()
        for (i in 0 until 30) AlertQueue.enqueue(big, "$json$i", t0)
        ok("the queue is capped", AlertQueue.load(big, t0).size == AlertQueue.MAX_QUEUED)

        // ---- pairing
        val id = "00000000-0000-4000-8000-000000000001"
        val token = "A".repeat(43)
        ok("a good pairing code is read", PairingCode.parse("$id.$token")?.elderId == id)
        ok("garbage is not a pairing code", PairingCode.parse("hello") == null && PairingCode.parse("$id.") == null && PairingCode.parse(".$token") == null && PairingCode.parse("$id.short") == null)

        println("all $n Android logic checks passed")
        return n
    }
}

fun main(args: Array<String>) {
    LogicSelfTest.run(args.firstOrNull() ?: "../test-vectors/number-vectors.csv")
}
