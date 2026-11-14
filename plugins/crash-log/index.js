// Adds an on-device crash log for Android: uncaught JVM exceptions are written to a file, and a
// second launcher entry, "Langkah log", shows that file plus Android's exit records (native crashes,
// ANRs) with Share and Copy buttons. Lets testers report start-up crashes without adb.
const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod, withMainApplication } = require("expo/config-plugins");

const SOURCES = ["CrashLog.kt", "CrashLogActivity.kt"];
const ATTACH = `
  override fun attachBaseContext(base: android.content.Context) {
    super.attachBaseContext(base)
    CrashLog.install(this, base)
  }
`;

function patchMainApplication(src) {
  if (src.includes("CrashLog.install")) return src;
  const onCreate = "  override fun onCreate() {\n    super.onCreate()\n";
  const onConfig = "    super.onConfigurationChanged(newConfig)\n";
  if (!src.includes(onCreate) || !src.includes(onConfig)) {
    throw new Error("crash-log plugin: MainApplication.kt does not have the expected shape");
  }
  return src
    .replace(onCreate, `${ATTACH}\n${onCreate}    if (CrashLog.isViewer) return\n`)
    .replace(onConfig, `${onConfig}    if (CrashLog.isViewer) return\n`);
}

module.exports = function withCrashLog(config) {
  const pkg = config.android?.package;
  if (!pkg) throw new Error("crash-log plugin: android.package is required");

  config = withDangerousMod(config, [
    "android",
    (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/java", ...pkg.split("."));
      fs.mkdirSync(dir, { recursive: true });
      for (const name of SOURCES) {
        const text = fs.readFileSync(path.join(__dirname, name), "utf8").replace("__PACKAGE__", pkg);
        fs.writeFileSync(path.join(dir, name), text);
      }
      return cfg;
    },
  ]);

  config = withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== "kt") throw new Error("crash-log plugin: expected Kotlin MainApplication");
    cfg.modResults.contents = patchMainApplication(cfg.modResults.contents);
    return cfg;
  });

  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    app.activity = (app.activity ?? []).filter((a) => a.$["android:name"] !== ".CrashLogActivity");
    app.activity.push({
      $: {
        "android:name": ".CrashLogActivity",
        "android:label": "Langkah log",
        "android:process": ":crashlog",
        "android:taskAffinity": `${pkg}.crashlog`,
        "android:theme": "@android:style/Theme.DeviceDefault.Light.NoActionBar",
        "android:exported": "true",
      },
      "intent-filter": [
        {
          action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
          category: [{ $: { "android:name": "android.intent.category.LAUNCHER" } }],
        },
      ],
    });
    return cfg;
  });
};
