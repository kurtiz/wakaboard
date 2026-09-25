import { formatDuration, localDateKey } from "@wakaboard/core";
import { ScrollView, Text, View } from "react-native";
import { DashboardCard } from "../../../components/dashboard-card";
import { WeeklyChart } from "../../../components/weekly-chart";
import { useDashboard } from "../../../data/dashboard-context";
import { usePalette } from "../../../theme";

export default function InsightsScreen() {
  const palette = usePalette();
  const { summaries } = useDashboard();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      seconds: summaries.find((summary) => summary.date === key)?.totalSeconds ?? 0,
    };
  });
  const total = days.reduce((seconds, day) => seconds + day.seconds, 0);
  const activeDays = days.filter((day) => day.seconds > 0).length;
  const best = Math.max(...days.map((day) => day.seconds));

  return (
    <ScrollView
      className="flex-1"
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 36 }}
    >
      <Text style={{ color: palette.muted, fontSize: 16, lineHeight: 24 }}>
        Your last seven days, at a glance.
      </Text>
      <View
        className="gap-2 rounded-[28px] p-6"
        style={{
          backgroundColor: palette.hero,
          borderCurve: "continuous",
        }}
      >
        <Text style={{ color: "#A8D9BD", fontSize: 14, fontWeight: "700" }}>
          LAST 7 DAYS
        </Text>
        <Text
          selectable
          style={{ color: "#FFFFFF", fontSize: 46, fontWeight: "800", fontVariant: ["tabular-nums"] }}
        >
          {formatDuration(total)}
        </Text>
        <Text style={{ color: "#B7D6C5", fontSize: 15 }}>
          {activeDays} active {activeDays === 1 ? "day" : "days"} this week
        </Text>
      </View>

      <DashboardCard title="Daily rhythm">
        <Text selectable style={{ color: palette.muted, fontSize: 14, lineHeight: 21 }}>
          {total > 0
            ? `You coded for ${formatDuration(total)} across ${activeDays} days. Your busiest day was ${formatDuration(best)}.`
            : "No activity is saved for this week yet."}
        </Text>
        <WeeklyChart days={days} />
      </DashboardCard>

      <DashboardCard title="Your pace">
        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <Text style={{ color: palette.muted, fontSize: 13 }}>Daily average</Text>
            <Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "700" }}>
              {formatDuration(total / 7)}
            </Text>
          </View>
          <View className="flex-1 gap-1.5">
            <Text style={{ color: palette.muted, fontSize: 13 }}>Best day</Text>
            <Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "700" }}>
              {formatDuration(best)}
            </Text>
          </View>
        </View>
      </DashboardCard>
    </ScrollView>
  );
}
