import { formatDuration, localDateKey, type Breakdown, type DailySummary } from "@wakaboard/core";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { BreakdownRows, DashboardCard } from "../../../components/dashboard-card";
import { WeeklyChart } from "../../../components/weekly-chart";
import { useDashboard } from "../../../data/dashboard-context";
import { usePalette } from "../../../theme";

type RangeDays = 7 | 30 | 90;

function dateBefore(days: number): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function aggregate(days: DailySummary[], field: "projects" | "languages" | "editors"): Breakdown[] {
  const totals = new Map<string, number>();
  for (const day of days) for (const row of day[field]) totals.set(row.name, (totals.get(row.name) ?? 0) + row.seconds);
  return [...totals].map(([name, seconds]) => ({ name, seconds })).sort((a, b) => b.seconds - a.seconds).slice(0, 5);
}

export default function InsightsScreen() {
  const palette = usePalette();
  const { summaries } = useDashboard();
  const [range, setRange] = useState<RangeDays>(7);
  const data = useMemo(() => {
    const cutoff = localDateKey(dateBefore(range - 1));
    const previousCutoff = localDateKey(dateBefore(range * 2 - 1));
    const previousEnd = localDateKey(dateBefore(range));
    const current = summaries.filter((day) => day.date >= cutoff);
    const previous = summaries.filter((day) => day.date >= previousCutoff && day.date <= previousEnd);
    const total = current.reduce((sum, day) => sum + day.totalSeconds, 0);
    const previousTotal = previous.reduce((sum, day) => sum + day.totalSeconds, 0);
    const active = current.filter((day) => day.totalSeconds > 0);
    const totalsByDate = new Map(current.map((day) => [day.date, day.totalSeconds]));
    const bucketCount = range === 7 ? 7 : range === 30 ? 5 : 6;
    const bucketSize = Math.ceil(range / bucketCount);
    const bars = Array.from({ length: bucketCount }, (_, index) => {
      const offset = (bucketCount - 1 - index) * bucketSize;
      const dates = Array.from({ length: bucketSize }, (_, step) => localDateKey(dateBefore(offset + step)));
      return {
        key: dates[0],
        label: range === 7 ? dateBefore(offset).toLocaleDateString(undefined, { weekday: "short" }) : dateBefore(offset).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        seconds: dates.reduce((sum, date) => sum + (totalsByDate.get(date) ?? 0), 0),
      };
    });
    return {
      current, total, activeDays: active.length,
      best: Math.max(0, ...current.map((day) => day.totalSeconds)),
      previousTotal,
      hasPrevious: previous.length > 0,
      bars,
      projects: aggregate(current, "projects"),
      languages: aggregate(current, "languages"),
      editors: aggregate(current, "editors"),
    };
  }, [range, summaries]);

  const change = data.hasPrevious && data.previousTotal > 0 ? Math.round(((data.total - data.previousTotal) / data.previousTotal) * 100) : null;

  return (
    <ScrollView
      className="flex-1"
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 36 }}
    >
      <Text style={{ color: palette.muted, fontSize: 16, lineHeight: 24 }}>Your coding rhythm, at a glance.</Text>
      <View style={{ flexDirection: "row", gap: 8, backgroundColor: palette.track, padding: 5, borderRadius: 999 }}>
        {([7, 30, 90] as const).map((option) => (
          <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: range === option }} onPress={() => setRange(option)} style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: range === option ? palette.card : "transparent" }}>
            <Text style={{ color: range === option ? palette.text : palette.muted, fontWeight: "700" }}>{option}D</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ backgroundColor: palette.hero, borderRadius: 28, padding: 24, gap: 8 }}>
        <Text style={{ color: palette.heroKicker, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>LAST {range} DAYS</Text>
        <Text selectable style={{ color: palette.onPrimary, fontSize: 46, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(data.total)}</Text>
        <View style={{ flexDirection: "row", gap: 22 }}>
          <Text style={{ color: palette.heroMuted, fontSize: 13 }}>{data.activeDays} active days</Text>
          <Text style={{ color: palette.heroMuted, fontSize: 13 }}>{change === null ? "No prior comparison" : `${change >= 0 ? "+" : ""}${change}% vs prior ${range}D`}</Text>
        </View>
      </View>

      {data.current.length < range && <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>Showing {data.current.length} saved {data.current.length === 1 ? "day" : "days"} in this range. Older activity appears after it syncs.</Text>}

      <DashboardCard title="Coding rhythm">
        <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 20 }}>{data.total > 0 ? `${formatDuration(data.total)} across ${data.activeDays} active days.` : "No activity is saved for this range yet."}</Text>
        <WeeklyChart days={data.bars} />
      </DashboardCard>

      <DashboardCard title="Your pace">
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ flex: 1, gap: 5 }}><Text style={{ color: palette.muted, fontSize: 13 }}>Daily average</Text><Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "700" }}>{formatDuration(data.total / range)}</Text></View>
          <View style={{ flex: 1, gap: 5 }}><Text style={{ color: palette.muted, fontSize: 13 }}>Best day</Text><Text selectable style={{ color: palette.text, fontSize: 22, fontWeight: "700" }}>{formatDuration(data.best)}</Text></View>
        </View>
      </DashboardCard>

      {(["projects", "languages", "editors"] as const).map((field) => (
        <DashboardCard key={field} title={field[0].toUpperCase() + field.slice(1)}>
          {data[field].length ? <BreakdownRows rows={data[field]} /> : <Text style={{ color: palette.muted }}>No {field} saved for this range.</Text>}
        </DashboardCard>
      ))}

      <DashboardCard title="Activity timeline">
        <Text style={{ color: palette.muted, fontSize: 14, lineHeight: 21 }}>Explore your saved coding days and project breakdowns.</Text>
        <Link href="/(tabs)/(insights)/activity" style={{ color: palette.accent, fontSize: 14, fontWeight: "700", paddingVertical: 8 }}>View activity →</Link>
      </DashboardCard>
    </ScrollView>
  );
}
