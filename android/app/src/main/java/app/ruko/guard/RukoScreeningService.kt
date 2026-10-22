package app.ruko.guard

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.telecom.Connection
import app.ruko.guard.logic.Grade
import app.ruko.guard.logic.ScreenAction
import app.ruko.guard.logic.Verification
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

// The standard Android call-screening service. The system calls onScreenCall for an incoming call BEFORE it rings, and the
// app has about five seconds to answer, so everything here is fast and has a hard stop. The app never hears the call and
// never records anything; it only sees the number and whether the carrier verified it.
//
// This is a warning layer, not a guarantee: a spoofed or brand-new number can be graded green or yellow.
class RukoScreeningService : CallScreeningService() {
    private val pool = Executors.newCachedThreadPool()

    override fun onScreenCall(callDetails: Call.Details) {
        // Only incoming calls. Anything unusual: let it ring (never block by accident).
        if (callDetails.callDirection != Call.Details.DIRECTION_INCOMING) {
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }
        val number = callDetails.handle?.schemeSpecificPart
        if (number.isNullOrBlank()) {
            respondToCall(callDetails, CallResponse.Builder().build())
            return
        }
        val verification = if (Build.VERSION.SDK_INT >= 30) {
            when (callDetails.callerNumberVerificationStatus) {
                Connection.VERIFICATION_STATUS_PASSED -> Verification.PASSED
                Connection.VERIFICATION_STATUS_FAILED -> Verification.FAILED
                else -> Verification.NOT_VERIFIED
            }
        } else Verification.NOT_VERIFIED

        // Answer within about 2.5 seconds, whatever happens: a slow network must never delay or block a call.
        val job = pool.submit(Callable { ScreeningCore.screen(applicationContext, number, verification, serverTimeoutMs = 1500) })
        val outcome = try {
            job.get(2500, TimeUnit.MILLISECONDS)
        } catch (e: Exception) {
            job.cancel(true)
            null
        }

        val action = outcome?.action ?: ScreenAction.ALLOW
        val response = CallResponse.Builder()
            // The call always stays in the call log and the person is always told: nothing is hidden from them.
            .setSkipCallLog(false)
            .setSkipNotification(false)
        when (action) {
            ScreenAction.ALLOW, ScreenAction.ALLOW_WITH_CARE_NOTE -> {}
            ScreenAction.SILENCE_AND_WARN -> response.setSilenceCall(true)
            ScreenAction.REJECT_AND_WARN -> response.setDisallowCall(true).setRejectCall(true)
        }
        respondToCall(callDetails, response.build())

        // After answering: the warning, and the family alert (which may take a moment, so off this thread).
        if (outcome != null && outcome.grade != Grade.GREEN) {
            pool.execute { ScreeningCore.afterDecision(applicationContext, outcome) }
        }
    }
}
