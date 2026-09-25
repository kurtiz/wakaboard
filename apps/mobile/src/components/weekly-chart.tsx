import { formatDuration } from "@wakaboard/core";
import { Text, View } from "react-native";
import { usePalette } from "../theme";
import type { WeeklyChartDay } from "./weekly-chart-data";

export function WeeklyChart({ days }: { days: WeeklyChartDay[] }) {
  const palette = usePalette();
  const max = Math.max(1, ...days.map((day) => day.seconds));
  return (
    <View className="h-[142px] flex-row items-end gap-[9px]">
      {days.map((day) => (
        <View key={day.key} className="flex-1 items-center gap-2">
          <View
            accessibilityLabel={`${day.label}: ${formatDuration(day.seconds)}`}
            className="w-full rounded-[7px]"
            style={{
              backgroundColor: day.seconds > 0 ? palette.accent : palette.track,
              height: Math.max(7, Math.round((day.seconds / max) * 104)),
            }}
          />
          <Text style={{ color: palette.muted, fontSize: 12, fontWeight: "600" }}>
            {day.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
