import type { Breakdown } from "@wakaboard/core";
import { formatDuration } from "@wakaboard/core";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { usePalette } from "../theme";

export function DashboardCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const palette = usePalette();
  return (
    <View
      className="gap-[18px] rounded-3xl border p-5"
      style={{
        backgroundColor: palette.card,
        borderColor: palette.border,
        borderCurve: "continuous",
      }}
    >
      <Text
        className="text-xl font-bold"
        accessibilityRole="header"
        style={{ color: palette.text }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export function BreakdownRows({ rows }: { rows: Breakdown[] }) {
  const palette = usePalette();
  const max = Math.max(...rows.map((row) => row.seconds), 1);
  return (
    <View className="gap-4">
      {rows.map((row) => (
        <View key={row.name} className="gap-[7px]">
          <View className="flex-row justify-between">
            <Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>
              {row.name}
            </Text>
            <Text
              selectable
              style={{ color: palette.muted, fontSize: 14, fontVariant: ["tabular-nums"] }}
            >
              {formatDuration(row.seconds)}
            </Text>
          </View>
          <View className="h-[5px] rounded" style={{ backgroundColor: palette.track }}>
            <View
              className="h-[5px] rounded"
              style={{
                backgroundColor: palette.bar,
                width: `${Math.round((row.seconds / max) * 100)}%`,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
