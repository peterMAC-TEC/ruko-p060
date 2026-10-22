package app.ruko.guard.logic

// An alert that could not be sent (no signal) waits here and goes out when the phone is back online. Holds the alert
// payload only (codes and a hash). Capped, deduplicated, and it expires, so an old alert never arrives hours late.
// Storage is behind a tiny interface so this is testable without Android; the app backs it with SharedPreferences.

interface QueueStore {
    fun read(): List<Pair<Long, String>>
    fun write(items: List<Pair<Long, String>>)
}

object AlertQueue {
    const val MAX_QUEUED = 10
    const val MAX_AGE_MS = 30 * 60_000L

    fun load(store: QueueStore, now: Long): List<Pair<Long, String>> = store.read().filter { now - it.first < MAX_AGE_MS }.takeLast(MAX_QUEUED)

    fun enqueue(store: QueueStore, payload: String, now: Long) {
        val items = load(store, now).toMutableList()
        if (items.none { it.second == payload }) items += now to payload
        store.write(items.takeLast(MAX_QUEUED))
    }

    /** Try each waiting alert. Keeps the ones that fail. Returns how many went out. */
    fun flush(store: QueueStore, now: Long, send: (String) -> Boolean): Int {
        val left = mutableListOf<Pair<Long, String>>()
        var sent = 0
        for (item in load(store, now)) {
            val ok = try {
                send(item.second)
            } catch (e: Exception) {
                false
            }
            if (ok) sent++ else left += item
        }
        store.write(left)
        return sent
    }
}
