import { formatDuration, type DailySummary } from "@wakaboard/core";
import { Link } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { BreakdownRows, DashboardCard } from "../../../components/dashboard-card";
import { useDashboard } from "../../../data/dashboard-context";
import { usePalette } from "../../../theme";

export default function ActivityScreen() {
  const palette = usePalette();
  const { summaries } = useDashboard();
  const days = summaries.slice(0, 30);
  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ gap: 14, padding: 20, paddingBottom: 40 }}
      data={days}
      keyExtractor={(day) => day.date}
      ListHeaderComponent={<Text style={{ color: palette.muted, fontSize: 15, lineHeight: 22 }}>Your saved coding days, newest first. Activity stays available offline.</Text>}
      ListEmptyComponent={
        <DashboardCard title="No activity yet">
          <Text style={{ color: palette.muted, lineHeight: 22 }}>Connect WakaTime or explore sample activity to build your timeline.</Text>
          <Link href="/(tabs)/(settings)" style={{ color: palette.accent, fontWeight: "700" }}>Open Settings</Link>
        </DashboardCard>
      }
      renderItem={({ item }: { item: DailySummary }) => (
        <DashboardCard title={new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text selectable style={{ color: palette.text, fontSize: 30, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(item.totalSeconds)}</Text>
            {item.source === "sample" ? <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>SAMPLE</Text> : null}
          </View>
          {item.projects.length ? <BreakdownRows rows={item.projects.slice(0, 3)} /> : <Text style={{ color: palette.muted }}>No project details saved for this day.</Text>}
        </DashboardCard>
      )}
    />
  );
}
