package app.ruko.guard.logic

// What Ruko does with a graded call, and whether it tells the family. Plain rules, no Android classes.

enum class ScreenAction {
    /** Let it ring as normal. */
    ALLOW,

    /** Let it ring, and show a quiet "be careful" note. */
    ALLOW_WITH_CARE_NOTE,

    /** Silence the ring and show a large "do not pay anyone on this call" warning. The person can still answer. */
    SILENCE_AND_WARN,

    /** Reject the call (only for red, and only if the person turned on "block the worst"; off by default). */
    REJECT_AND_WARN,
}

object Decision {
    /**
     * A number in the contacts is never silenced or blocked, whatever the grade. With the standard call-screening role the
     * system is meant to hand us only numbers that are not in the contacts, so this is a second safety, not the only one.
     */
    fun decide(grade: Grade, inContacts: Boolean, blockTheWorst: Boolean): ScreenAction {
        if (inContacts) return ScreenAction.ALLOW
        return when (grade) {
            Grade.GREEN -> ScreenAction.ALLOW
            Grade.YELLOW -> ScreenAction.ALLOW_WITH_CARE_NOTE
            Grade.ORANGE -> ScreenAction.SILENCE_AND_WARN
            Grade.RED -> if (blockTheWorst) ScreenAction.REJECT_AND_WARN else ScreenAction.SILENCE_AND_WARN
        }
    }

    /** Only orange and red tell the family, so one unknown number does not cry wolf. Contacts never do. */
    fun shouldTellFamily(grade: Grade, inContacts: Boolean): Boolean = !inContacts && (grade == Grade.ORANGE || grade == Grade.RED)
}
