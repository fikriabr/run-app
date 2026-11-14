package __PACKAGE__

import android.annotation.TargetApi
import android.app.Activity
import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.view.ViewGroup.LayoutParams.WRAP_CONTENT
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

/** Plain Android screen that shows recorded crashes. It runs in its own process and never loads React Native. */
class CrashLogActivity : Activity() {
  private lateinit var body: TextView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val pad = (16 * resources.displayMetrics.density).toInt()

    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(pad, pad, pad, pad)
      fitsSystemWindows = true
    }
    root.addView(TextView(this).apply {
      text = "Langkah log"
      textSize = 22f
      setTypeface(typeface, Typeface.BOLD)
    })
    val actions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
    actions.addView(button("Bagikan") { share() })
    actions.addView(button("Salin") { copy() })
    actions.addView(button("Hapus") {
      CrashLog.clear(this)
      render()
    })
    root.addView(actions)

    body = TextView(this).apply {
      typeface = Typeface.MONOSPACE
      textSize = 11f
      setTextIsSelectable(true)
    }
    root.addView(
      ScrollView(this).apply { addView(body) },
      LinearLayout.LayoutParams(MATCH_PARENT, 0, 1f),
    )
    setContentView(root)
    render()
  }

  private fun button(label: String, onClick: () -> Unit) = Button(this).apply {
    text = label
    setOnClickListener { onClick() }
    layoutParams = LinearLayout.LayoutParams(0, WRAP_CONTENT, 1f)
  }

  private fun render() {
    body.text = report()
  }

  private fun report(): String = buildString {
    append("Device: ").append(CrashLog.device()).append("\n\n")
    append("== Last Java/Kotlin crash ==\n")
    append(CrashLog.read(this@CrashLogActivity) ?: "(none recorded)\n")
    append("\n== Android exit records ==\n")
    append(exitRecords())
  }

  private fun exitRecords(): String =
    if (Build.VERSION.SDK_INT >= 30) exitRecordsApi30() else "(needs Android 11 or newer)\n"

  @TargetApi(30)
  private fun exitRecordsApi30(): String {
    val am = getSystemService(ActivityManager::class.java) ?: return "(unavailable)\n"
    val records = try {
      am.getHistoricalProcessExitReasons(packageName, 0, 6)
    } catch (e: Throwable) {
      return "(failed: ${e.message})\n"
    }
    if (records.isEmpty()) return "(none)\n"
    return buildString {
      for (info in records) {
        append("\n").append(CrashLog.stamp(info.timestamp))
        append("  ").append(reason(info.reason))
        append("  process=").append(info.processName)
        append("  status=").append(info.status).append('\n')
        info.description?.let { append("  ").append(it).append('\n') }
        if (info.reason == ApplicationExitInfo.REASON_CRASH_NATIVE || info.reason == ApplicationExitInfo.REASON_ANR) {
          append(trace(info))
        }
      }
    }
  }

  @TargetApi(30)
  private fun trace(info: ApplicationExitInfo): String {
    var bytes: ByteArray? = null
    try {
      bytes = info.traceInputStream?.use { it.readBytes() }
    } catch (e: Throwable) {
      return "  (trace unreadable: ${e.message})\n"
    }
    if (bytes == null) return "  (no trace)\n"
    // ANR traces are text; native tombstones are protobuf, so pull out their readable strings
    // (signal, abort message, library and function names).
    val lines = if (info.reason == ApplicationExitInfo.REASON_ANR) {
      String(bytes).lines()
    } else {
      printableRuns(bytes)
    }
    return lines.take(160).joinToString("\n", postfix = "\n") { "  $it" }
  }

  private fun printableRuns(bytes: ByteArray): List<String> {
    val out = ArrayList<String>()
    val run = StringBuilder()
    fun flush() {
      if (run.length >= 4 && out.lastOrNull() != run.toString()) out.add(run.toString())
      run.setLength(0)
    }
    for (b in bytes) {
      val c = b.toInt() and 0xFF
      if (c in 0x20..0x7E) run.append(c.toChar()) else flush()
    }
    flush()
    return out
  }

  @TargetApi(30)
  private fun reason(code: Int): String = when (code) {
    ApplicationExitInfo.REASON_CRASH -> "CRASH (Java/Kotlin)"
    ApplicationExitInfo.REASON_CRASH_NATIVE -> "CRASH_NATIVE"
    ApplicationExitInfo.REASON_ANR -> "ANR"
    ApplicationExitInfo.REASON_LOW_MEMORY -> "LOW_MEMORY"
    ApplicationExitInfo.REASON_INITIALIZATION_FAILURE -> "INITIALIZATION_FAILURE"
    ApplicationExitInfo.REASON_SIGNALED -> "SIGNALED"
    ApplicationExitInfo.REASON_EXIT_SELF -> "EXIT_SELF"
    ApplicationExitInfo.REASON_USER_REQUESTED -> "USER_REQUESTED"
    ApplicationExitInfo.REASON_DEPENDENCY_DIED -> "DEPENDENCY_DIED"
    ApplicationExitInfo.REASON_EXCESSIVE_RESOURCE_USAGE -> "EXCESSIVE_RESOURCE_USAGE"
    ApplicationExitInfo.REASON_PERMISSION_CHANGE -> "PERMISSION_CHANGE"
    else -> "reason $code"
  }

  private fun share() {
    val send = Intent(Intent.ACTION_SEND).apply {
      type = "text/plain"
      putExtra(Intent.EXTRA_SUBJECT, "Langkah log")
      putExtra(Intent.EXTRA_TEXT, body.text.toString().take(90_000))
    }
    startActivity(Intent.createChooser(send, "Bagikan log"))
  }

  private fun copy() {
    val clipboard = getSystemService(ClipboardManager::class.java) ?: return
    clipboard.setPrimaryClip(ClipData.newPlainText("Langkah log", body.text.toString().take(90_000)))
    Toast.makeText(this, "Log disalin", Toast.LENGTH_SHORT).show()
  }
}
