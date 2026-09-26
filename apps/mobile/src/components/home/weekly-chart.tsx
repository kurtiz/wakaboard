import { Text } from "../ui/app-text";
import { formatDuration } from "@wakaboard/core";
import { View } from "react-native";
import { usePalette } from "../../theme";
import type { WeeklyChartDay } from "./weekly-chart-data";
import { BarChartGuides } from "../ui/bar-chart-guides";

export function WeeklyChart({ days }: { days: WeeklyChartDay[] }) {
  const palette = usePalette();
  const max = Math.max(1, ...days.map((day) => day.seconds));
  return (
    <View style={{ height: 142 }}>
      <BarChartGuides maximumSeconds={max} top={9} height={103} left={47} lineColor={palette.border} labelColor={palette.muted} />
      <View style={{ position: "absolute", top: 9, left: 47, right: 0, height: 103, flexDirection: "row", alignItems: "flex-end", gap: 9 }}>
        {days.map((day) => <View key={day.key} accessibilityLabel={`${day.label}: ${formatDuration(day.seconds)}`} style={{ flex: 1, height: Math.max(7, Math.round((day.seconds / max) * 103)), borderRadius: 7, backgroundColor: day.seconds > 0 ? palette.accent : palette.track }} />)}
      </View>
      <View style={{ position: "absolute", top: 119, left: 47, right: 0, flexDirection: "row", gap: 9 }}>
        {days.map((day) => <Text key={day.key} style={{ flex: 1, textAlign: "center", color: palette.muted, fontSize: 12, fontWeight: "700" }}>{day.label}</Text>)}
      </View>
    </View>
  );
}
