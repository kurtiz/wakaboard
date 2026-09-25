import { Host } from "@expo/ui";
import { Chart } from "@expo/ui/swift-ui";
import { usePalette } from "../theme";
import type { WeeklyChartDay } from "./weekly-chart-data";

export function WeeklyChart({ days }: { days: WeeklyChartDay[] }) {
  const palette = usePalette();
  return (
    <Host style={{ height: 142, width: "100%" }} colorScheme={palette.scheme} seedColor={palette.accent}>
      <Chart
        type="bar"
        data={days.map((day) => ({
          x: day.label,
          y: day.seconds / 3600,
          color: day.seconds > 0 ? palette.accent : palette.track,
        }))}
        showGrid={false}
        barStyle={{ cornerRadius: 7 }}
      />
    </Host>
  );
}
