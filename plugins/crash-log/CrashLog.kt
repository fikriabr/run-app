package __PACKAGE__

import android.app.Application
import android.content.Context
import android.os.Build
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Records uncaught JVM exceptions to a file so they can be read on the phone without adb.
 * The "Langkah log" launcher entry (CrashLogActivity) shows the file and Android's own exit records.
 */
object CrashLog {
  private const val FILE = "langkah-native-crash.txt"
  private const val VIEWER_SUFFIX = ":crashlog"

  /** True inside the log viewer's own process, which must not start React Native. */
  var isViewer = false
    private set

  private var installed = false

  fun install(app: Application, base: Context) {
    if (installed) return
    installed = true
    isViewer = processName().endsWith(VIEWER_SUFFIX)
    if (isViewer) return
    val dir = base.filesDir
    val previous = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { thread, error ->
      try {
        File(dir, FILE).writeText(describe(app, thread, error))
      } catch (e: Throwable) {
        // Nothing more can be done while the process is dying.
      }
      previous?.uncaughtException(thread, error)
    }
  }

  fun read(context: Context): String? {
    val file = File(context.filesDir, FILE)
    return if (file.exists()) file.readText() else null
  }

  fun clear(context: Context) {
    File(context.filesDir, FILE).delete()
  }

  fun device(): String =
    "${Build.MANUFACTURER} ${Build.MODEL} (${Build.DEVICE}), Android ${Build.VERSION.RELEASE} / API ${Build.VERSION.SDK_INT}, ABI ${Build.SUPPORTED_ABIS.joinToString(",")}"

  fun stamp(millis: Long): String = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date(millis))

  private fun describe(app: Application, thread: Thread, error: Throwable): String {
    val trace = StringWriter()
    error.printStackTrace(PrintWriter(trace))
    val version = try {
      app.packageManager.getPackageInfo(app.packageName, 0).versionName
    } catch (e: Throwable) {
      "?"
    }
    return buildString {
      append("Time: ").append(stamp(System.currentTimeMillis())).append('\n')
      append("App: ").append(app.packageName).append(' ').append(version).append('\n')
      append("Device: ").append(device()).append('\n')
      append("Thread: ").append(thread.name).append('\n')
      append('\n').append(trace.toString())
    }
  }

  private fun processName(): String {
    if (Build.VERSION.SDK_INT >= 28) return Application.getProcessName() ?: ""
    return try {
      File("/proc/self/cmdline").readText().trim { it <= ' ' || it == '\u0000' }
    } catch (e: Throwable) {
      ""
    }
  }
}
