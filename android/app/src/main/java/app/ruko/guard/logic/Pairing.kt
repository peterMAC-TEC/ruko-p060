package app.ruko.guard.logic

// The pairing code the family member shows in Ruko's setup screen: "<elder id>.<token>". It lets this phone report risky
// numbers for that one person, and nothing else.

data class Pairing(val elderId: String, val token: String)

object PairingCode {
    private val UUID = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
    private val TOKEN = Regex("^[A-Za-z0-9_-]{20,100}$")

    fun parse(raw: String): Pairing? {
        val s = raw.trim()
        val i = s.indexOf('.')
        if (i <= 0) return null
        val id = s.substring(0, i)
        val token = s.substring(i + 1)
        return if (UUID.matches(id) && TOKEN.matches(token)) Pairing(id, token) else null
    }
}
