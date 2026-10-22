package app.ruko.guard

import app.ruko.guard.logic.AlertPayload
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

// The two things the app asks of the Ruko server: "how risky is this number?" and "please tell the family". Plain HTTPS
// with a short timeout, because a call screening service has about five seconds to answer.
object RukoApi {
    data class Lookup(val score: Int, val reasons: List<String>, val hash: String?)

    /** How risky is this number? Returns null if the server cannot be reached quickly: the caller falls back to the on-phone grade. */
    fun lookup(number: String, timeoutMs: Int): Lookup? = try {
        val url = URL("${BuildConfig.RUKO_BASE_URL}/api/number?n=${URLEncoder.encode(number, "UTF-8")}")
        val c = (url.openConnection() as HttpURLConnection).apply {
            connectTimeout = timeoutMs
            readTimeout = timeoutMs
            requestMethod = "GET"
        }
        if (c.responseCode !in 200..299) null
        else {
            val o = JSONObject(c.inputStream.bufferedReader().readText())
            val r = o.getJSONArray("reasons")
            Lookup(o.getInt("score"), (0 until r.length()).map { r.getString(it) }, o.optString("hash").ifEmpty { null })
        }
    } catch (e: Exception) {
        null
    }

    /** Send an alert payload (built by AlertPayload: codes and a hash only). True if the server accepted it. */
    fun sendAlert(payload: String, token: String): Boolean = try {
        val c = (URL("${BuildConfig.RUKO_BASE_URL}/api/alerts/risk").openConnection() as HttpURLConnection).apply {
            connectTimeout = 5000
            readTimeout = 5000
            requestMethod = "POST"
            doOutput = true
            setRequestProperty("content-type", "application/json")
            setRequestProperty("x-ruko-device", token)
        }
        c.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
        c.responseCode in 200..299
    } catch (e: Exception) {
        false
    }

    /** The Rule Card sentence for this phone (needs the pairing). */
    fun ruleCard(elderId: String, token: String): Pair<String, String>? = try {
        val c = (URL("${BuildConfig.RUKO_BASE_URL}/api/device/rule-card?elderId=${URLEncoder.encode(elderId, "UTF-8")}").openConnection() as HttpURLConnection).apply {
            connectTimeout = 5000
            readTimeout = 5000
            setRequestProperty("x-ruko-device", token)
        }
        if (c.responseCode !in 200..299) null
        else JSONObject(c.inputStream.bufferedReader().readText()).let { it.getString("en") to it.getString("hing") }
    } catch (e: Exception) {
        null
    }

    @Suppress("unused")
    private fun unused() = AlertPayload // keeps the logic package referenced from one obvious place
}
