import { useState } from "react";
import { View } from "react-native";
import { TopTabs } from "@/components/top-tabs";
import { useT } from "@/i18n";
import { ActivityScreen } from "./activity";
import { YouScreen } from "./you";

/** The You tab: fitness and stats, plus the history of runs and workouts. */
export function YouTabScreen() {
  const t = useT();
  const [tab, setTab] = useState<"progress" | "history">("progress");
  return (
    <View style={{ flex: 1 }}>
      <TopTabs
        tabs={[
          ["progress", t.you.progress],
          ["history", t.you.historyTab],
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "progress" ? <YouScreen /> : <ActivityScreen />}
    </View>
  );
}
