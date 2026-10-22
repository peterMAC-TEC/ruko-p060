package app.ruko.guard

import android.Manifest
import android.app.Activity
import android.app.role.RoleManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Switch
import android.widget.TextView
import java.text.DateFormat
import java.util.Date

// One plain screen, large type, one thing at a time: the Rule Card, a status line, the button that turns Ruko on, and the recent warnings.
// Text is 20sp or larger and buttons are 64dp or taller. No jargon, no blame. It is deliberately simple and has no extra libraries.
class MainActivity : Activity() {
    private val roleRequest = 4711
    private lateinit var prefs: Prefs
    private lateinit var root: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = Prefs(this)
        val scroll = ScrollView(this)
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(24), dp(24), dp(40))
        }
        scroll.addView(root)
        setContentView(scroll)
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }
    }

    override fun onResume() {
        super.onResume()
        render()
        ScreeningCore.flushQueue(this) // any alert that was waiting for a signal
        val id = prefs.elderId
        val token = prefs.token
        if (id != null && token != null) {
            Thread {
                RukoApi.ruleCard(id, token)?.let { (en, hing) ->
                    prefs.ruleEn = en
                    prefs.ruleHing = hing
                    runOnUiThread { render() }
                }
            }.start()
        }
    }

    private fun roleHeld(): Boolean {
        val rm = getSystemService(RoleManager::class.java)
        return rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING) && rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
    }

    private fun render() {
        root.removeAllViews()
        val on = roleHeld()

        text("ruko", 40f, bold = true)
        // The Rule Card is the headline.
        text(prefs.ruleEn, 28f, bold = true, top = 20)
        text(prefs.ruleHing, 20f, color = Color.parseColor("#666666"), top = 8)

        text(if (on) "Ruko is protecting your calls." else "Ruko is not on yet.", 22f, bold = true, top = 28)
        if (!on) {
            text("To turn Ruko on, tap the button, then choose Ruko Guard and tap Set as default. Ruko only sees the number that is calling. It cannot hear your calls.", 20f, top = 8)
            button("Turn Ruko on") {
                val rm = getSystemService(RoleManager::class.java)
                if (rm.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
                    @Suppress("DEPRECATION")
                    startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), roleRequest)
                }
            }
        }

        // Pairing: so Ruko can tell the family.
        text(if (prefs.paired) "Your family will be told about risky calls." else "Ask your family to open Ruko setup and show you the pairing code. Paste it here so Ruko can tell them about risky calls.", 20f, top = 28)
        if (!prefs.paired) {
            val box = EditText(this).apply {
                hint = "Pairing code"
                textSize = 20f
                inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
                minimumHeight = dp(64)
            }
            root.addView(box, lp())
            button("Pair this phone") {
                if (prefs.pair(box.text.toString())) render() else box.error = "That does not look like a pairing code."
            }
        }

        // The one setting.
        val sw = Switch(this).apply {
            text = "Block the worst calls (off by default)"
            textSize = 20f
            isChecked = prefs.blockTheWorst
            minimumHeight = dp(64)
            setOnCheckedChangeListener { _, v -> prefs.blockTheWorst = v }
        }
        root.addView(sw, lp(top = 24))
        text("Off: Ruko silences a dangerous call and warns you, and you can still answer. On: Ruko also rejects the very worst ones.", 16f, color = Color.parseColor("#666666"), top = 4)

        // Recent warnings.
        text("Recent warnings", 22f, bold = true, top = 32)
        val list = prefs.warnings()
        if (list.isEmpty()) text("None yet.", 20f, color = Color.parseColor("#666666"), top = 4)
        for (w in list) {
            val when_ = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(w.at))
            text("$when_ · ${w.grade.uppercase()}", 20f, bold = true, top = 12)
            if (w.reasons.isNotEmpty()) text(w.reasons.joinToString(", ") { it.replace('_', ' ') }, 16f, color = Color.parseColor("#666666"))
        }

        // The honest limits, always on screen.
        text("What Ruko can and cannot do", 22f, bold = true, top = 36)
        text("It looks at the number that is calling and warns you before it rings. It cannot talk to the caller or hear the call, and it does not record anything. A number it has never seen, or a faked number, can look safe. It is a warning, not a guarantee. If anyone asks for money, hang up and call your family or 1930.", 18f, top = 6)
        text("To check a number, Ruko sends it to the Ruko server. Only a risk level and reason codes are ever sent to your family, never the call.", 16f, color = Color.parseColor("#666666"), top = 8)
        text("Helpline 1930 · cybercrime.gov.in", 20f, bold = true, top = 16)
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == roleRequest) render()
    }

    // ---- small helpers ----
    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()

    private fun lp(top: Int = 0) = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { topMargin = dp(top) }

    private fun text(s: String, size: Float, bold: Boolean = false, color: Int = Color.parseColor("#171717"), top: Int = 0): TextView {
        val t = TextView(this).apply {
            text = s
            textSize = size
            setTextColor(color)
            if (bold) setTypeface(typeface, Typeface.BOLD)
        }
        root.addView(t, lp(top))
        return t
    }

    private fun button(label: String, onClick: () -> Unit): Button {
        val b = Button(this).apply {
            text = label
            textSize = 20f
            minimumHeight = dp(64)
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.parseColor("#171717"))
            setOnClickListener { onClick() }
        }
        root.addView(b, lp(top = 16))
        return b
    }

    @Suppress("unused")
    private fun hide(v: View) {
        v.visibility = View.GONE
    }
}
