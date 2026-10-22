package app.ruko.guard

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import app.ruko.guard.logic.Grade

// The warning the person sees when a risky call comes in: large words, one sentence, no jargon, never any blame.
object Notifier {
    private const val CHANNEL = "ruko_calls"

    private fun ensureChannel(context: Context) {
        val nm = context.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, "Ruko call warnings", NotificationManager.IMPORTANCE_HIGH))
        }
    }

    fun warn(context: Context, grade: Grade, silenced: Boolean, rejected: Boolean, rule: String) {
        ensureChannel(context)
        val title = when (grade) {
            Grade.RED -> "Danger. Do not pay anyone on this call."
            Grade.ORANGE -> "Be careful. Do not pay anyone on this call."
            Grade.YELLOW -> "Unknown number. Be careful."
            Grade.GREEN -> return
        }
        val body = buildString {
            append(if (rejected) "Ruko stopped this call from ringing. " else if (silenced) "Ruko silenced the ring. You can still answer. " else "")
            append(rule)
        }
        val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = Notification.Builder(context, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText("$title\n\n$body\n\nHelpline: 1930"))
            .setContentIntent(open)
            .setAutoCancel(true)
            .setCategory(Notification.CATEGORY_CALL)
            .build()
        // The notification permission may not be granted (Android 13+): then the call is still silenced, just without the note.
        try {
            context.getSystemService(NotificationManager::class.java).notify(if (grade == Grade.YELLOW) 2 else 1, n)
        } catch (e: SecurityException) {
            // Nothing else to do.
        }
    }
}
