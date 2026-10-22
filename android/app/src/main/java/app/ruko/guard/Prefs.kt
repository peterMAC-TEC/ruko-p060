package app.ruko.guard

import android.content.Context
import android.content.SharedPreferences
import app.ruko.guard.logic.PairingCode
import app.ruko.guard.logic.QueueStore
import org.json.JSONArray
import org.json.JSONObject

// Everything the app remembers, in one private place on the phone. It remembers: the pairing code, one switch, the Rule Card
// sentence, a short list of recent warnings (when, how serious, why: never a phone number), the grades the Ruko server gave
// for numbers (so a repeat call is instant), and alerts waiting for a signal. It never stores audio or what anyone said.
class Prefs(context: Context) {
    private val sp: SharedPreferences = context.getSharedPreferences("ruko_guard", Context.MODE_PRIVATE)

    var elderId: String?
        get() = sp.getString("elderId", null)
        set(v) = sp.edit().putString("elderId", v).apply()

    var token: String?
        get() = sp.getString("token", null)
        set(v) = sp.edit().putString("token", v).apply()

    /** "Block the worst": reject red calls instead of only silencing them. Off by default. */
    var blockTheWorst: Boolean
        get() = sp.getBoolean("blockWorst", false)
        set(v) = sp.edit().putBoolean("blockWorst", v).apply()

    var ruleEn: String
        get() = sp.getString("ruleEn", "If anyone asks for money on a call, hang up and call 1930. Never stay on the line.")!!
        set(v) = sp.edit().putString("ruleEn", v).apply()

    var ruleHing: String
        get() = sp.getString("ruleHing", "Agar koi call par paise maange, call kaat dijiye aur 1930 par phone kijiye. Line par kabhi mat rahiye.")!!
        set(v) = sp.edit().putString("ruleHing", v).apply()

    fun pair(code: String): Boolean {
        val p = PairingCode.parse(code) ?: return false
        elderId = p.elderId
        token = p.token
        return true
    }

    val paired: Boolean get() = elderId != null && token != null

    // ---- recent warnings (kept to the last 10, no phone numbers)
    data class Warning(val at: Long, val grade: String, val reasons: List<String>)

    fun addWarning(w: Warning) {
        val arr = JSONArray(sp.getString("warnings", "[]"))
        val out = JSONArray()
        out.put(JSONObject().put("at", w.at).put("grade", w.grade).put("reasons", JSONArray(w.reasons)))
        for (i in 0 until minOf(arr.length(), 9)) out.put(arr.get(i))
        sp.edit().putString("warnings", out.toString()).apply()
    }

    fun warnings(): List<Warning> {
        val arr = JSONArray(sp.getString("warnings", "[]"))
        return (0 until arr.length()).map {
            val o = arr.getJSONObject(it)
            val r = o.getJSONArray("reasons")
            Warning(o.getLong("at"), o.getString("grade"), (0 until r.length()).map { i -> r.getString(i) })
        }
    }

    // ---- what the server said about a number (kept 24 hours; keyed by the number, in private storage on this phone only)
    data class Cached(val score: Int, val reasons: List<String>, val hash: String?, val at: Long)

    fun cachedLookup(number: String, now: Long): Cached? {
        val o = JSONObject(sp.getString("lookups", "{}")).optJSONObject(number) ?: return null
        val at = o.getLong("at")
        if (now - at > 24 * 3_600_000L) return null
        val r = o.getJSONArray("reasons")
        return Cached(o.getInt("score"), (0 until r.length()).map { r.getString(it) }, o.optString("hash").ifEmpty { null }, at)
    }

    fun cacheLookup(number: String, c: Cached) {
        val all = JSONObject(sp.getString("lookups", "{}"))
        // Keep it small: forget everything if it grows past 200 numbers.
        if (all.length() > 200) for (k in all.keys().asSequence().toList()) all.remove(k)
        all.put(number, JSONObject().put("score", c.score).put("reasons", JSONArray(c.reasons)).put("hash", c.hash ?: "").put("at", c.at))
        sp.edit().putString("lookups", all.toString()).apply()
    }

    /** The waiting-alert queue, stored here. */
    val queue: QueueStore = object : QueueStore {
        override fun read(): List<Pair<Long, String>> {
            val arr = JSONArray(sp.getString("queue", "[]"))
            return (0 until arr.length()).map { arr.getJSONObject(it).let { o -> o.getLong("at") to o.getString("p") } }
        }

        override fun write(items: List<Pair<Long, String>>) {
            val arr = JSONArray()
            items.forEach { arr.put(JSONObject().put("at", it.first).put("p", it.second)) }
            sp.edit().putString("queue", arr.toString()).apply()
        }
    }
}
