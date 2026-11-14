// react-native-maps depends on WorkManager 2.9.1, which androidx.startup initialises before the app runs.
// Release builds shrink code with R8, and WorkManager's Room database (WorkDatabase_Impl) is only created
// by reflection, so R8 left it uninstantiable and every launch crashed with
// "Failed to create an instance of class androidx.work.impl.WorkDatabase". This keeps that class and
// pulls a WorkManager built against the same Room generation as the rest of the app.
const fs = require("fs");
const path = require("path");
const { withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");

const WORK_VERSION = "2.11.2";
const MARKER = "# langkah: workmanager keep rules";
const RULES = `
${MARKER}
-keep class * extends androidx.room.RoomDatabase { <init>(); }
-keep class androidx.work.impl.WorkDatabase_Impl { *; }
-keep class * extends androidx.work.ListenableWorker { public <init>(android.content.Context, androidx.work.WorkerParameters); }
`;

module.exports = function withWorkManagerFix(config) {
  config = withAppBuildGradle(config, (cfg) => {
    const line = `    implementation("androidx.work:work-runtime:${WORK_VERSION}")`;
    if (!cfg.modResults.contents.includes("androidx.work:work-runtime")) {
      cfg.modResults.contents = cfg.modResults.contents.replace(/\ndependencies\s*\{\n/, (m) => `${m}${line}\n`);
      if (!cfg.modResults.contents.includes(line)) throw new Error("workmanager plugin: no dependencies block in app/build.gradle");
    }
    return cfg;
  });

  return withDangerousMod(config, [
    "android",
    (cfg) => {
      const file = path.join(cfg.modRequest.platformProjectRoot, "app/proguard-rules.pro");
      const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      if (!text.includes(MARKER)) fs.writeFileSync(file, text + RULES);
      return cfg;
    },
  ]);
};
