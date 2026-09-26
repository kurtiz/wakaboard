import { Text } from "../ui/app-text";
import { formatDuration, type Breakdown } from "@wakaboard/core";
import { router } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ChartLineUpIcon } from "phosphor-react-native/src/icons/ChartLineUp";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { useMemo, useState, type ReactNode } from "react";
import { Alert, Share, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboard } from "../../data/dashboard-context";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";
import { ScaleButton } from "../ui/scale-button";
import { AnimatedHeightBar, AnimatedProgressBar, AnimatedProgressRing } from "../ui/animated-progress";
import { SegmentedPicker } from "../ui/segmented-picker";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../navigation/android-page-header";
import { buildAnalytics, type AnalyticsRange, type CadenceBucket } from "./analytics-data";

type Palette = ReturnType<typeof usePalette>;
const ranges: { value: AnalyticsRange; label: string }[] = [
  { value: 7, label: "7D" }, { value: 30, label: "30D" }, { value: 90, label: "90D" },
  { value: 365, label: "1Y" }, { value: "all", label: "ALL" },
];

function Surface({ children, palette, style }: { children: ReactNode; palette: Palette; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: palette.card, borderRadius: 28, padding: 18, gap: 16, borderCurve: "continuous" }, style]}>{children}</View>;
}

function ConsistencyRing({ value, palette }: { value: number; palette: Palette }) {
  return (
    <View style={{ width: 62, height: 62, alignItems: "center", justifyContent: "center" }}>
      <AnimatedProgressRing value={value} size={62} radius={21} strokeWidth={5} trackColor={palette.homeHeroTrack} color={palette.homeAmber} label={`${Math.round(value * 100)} percent consistency`} />
      <Text style={{ position: "absolute", color: palette.homeHeroText, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{Math.round(value * 100)}%</Text>
    </View>
  );
}

function RangePicker({ range, onChange }: { range: AnalyticsRange; onChange: (range: AnalyticsRange) => void }) {
  return <SegmentedPicker options={ranges} value={range} onChange={onChange} />;
}

function DigestCard({ data, range, palette }: { data: ReturnType<typeof buildAnalytics>; range: AnalyticsRange; palette: Palette }) {
  const consistency = data.activeDays / data.days;
  return (
    <View style={{ backgroundColor: palette.homeHero, borderRadius: 28, padding: 20, gap: 18, borderCurve: "continuous" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Text style={{ color: palette.homeHeroMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, flexShrink: 1 }}>TELEMETRY DIGEST · {range === "all" ? "ALL SAVED DAYS" : `LAST ${range} DAYS`}</Text>
        <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: palette.homeHeroChip }}><Text style={{ color: palette.homeHeroText, fontSize: 10, fontWeight: "700" }}>Saved locally</Text></View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: palette.homeHeroText, fontSize: 37, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -1 }}>{formatDuration(data.total)}</Text>
          <Text style={{ color: palette.homeHeroMuted, fontSize: 12 }}>Total coding time</Text>
        </View>
        <ConsistencyRing value={consistency} palette={palette} />
      </View>
      <View style={{ flexDirection: "row", gap: 8, borderRadius: 18, padding: 12, backgroundColor: palette.homeHeroChip }}>
        {([
          ["Daily pace", formatDuration(data.total / data.days)],
          ["Active days", `${data.activeDays}/${data.days}`],
          ["Peak streak", `${data.peakStreak}d`],
        ] as const).map(([label, value]) => <View key={label} style={{ flex: 1, gap: 5 }}>
          <Text numberOfLines={1} style={{ color: palette.homeHeroMuted, fontSize: 10 }}>{label}</Text>
          <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: label === "Peak streak" ? palette.homeAmber : palette.homeHeroText, fontSize: 17, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{value}</Text>
        </View>)}
      </View>
    </View>
  );
}

function CadenceBar({ bucket, height, selected, palette, onPress }: { bucket: CadenceBucket; height: number; selected: boolean; palette: Palette; onPress: () => void }) {
  return (
    <ScaleButton label={`${bucket.dateLabel}, ${formatDuration(bucket.seconds)}`} onPress={onPress} wrapperStyle={{ flex: 1 }} style={{ height: 132, justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 2 }}>
      <AnimatedHeightBar height={height} color={selected ? palette.homeAmber : bucket.seconds > 0 ? palette.primary : palette.homeSubtle} style={{ width: "100%", maxWidth: 20, minHeight: 6, borderRadius: 6 }} />
    </ScaleButton>
  );
}

function CadenceCard({ data, selectedIndex, onSelect, palette }: { data: ReturnType<typeof buildAnalytics>; selectedIndex: number; onSelect: (index: number) => void; palette: Palette }) {
  const selected = data.buckets[selectedIndex];
  const max = Math.max(1, ...data.buckets.map((bucket) => bucket.seconds));
  const peak = data.buckets.reduce((best, bucket) => Math.max(best, bucket.seconds), 0);
  return (
    <Surface palette={palette}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}><ChartLineUpIcon color={palette.primary} size={19} weight="bold" /><Text accessibilityRole="header" style={{ color: palette.text, fontSize: 18, fontWeight: "800" }}>Coding cadence</Text></View>
        <Text style={{ color: palette.muted, fontSize: 11 }}>Hours / period</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, padding: 11, borderRadius: 13, backgroundColor: palette.homeSubtle }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flex: 1 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.homeAmber }} /><Text numberOfLines={1} style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>{selected?.dateLabel ?? "No saved activity"}</Text></View>
        <Text selectable style={{ color: palette.primary, fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(selected?.seconds ?? 0)}</Text>
      </View>
      <View style={{ height: 134, flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
        {data.buckets.map((bucket, index) => <CadenceBar key={index} bucket={bucket} height={Math.max(6, Math.round(bucket.seconds / max * 122))} selected={index === selectedIndex} palette={palette} onPress={() => onSelect(index)} />)}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 4 }}>
        {data.buckets.map((bucket, index) => <Text key={bucket.key} numberOfLines={1} style={{ flex: 1, textAlign: "center", color: index === selectedIndex ? palette.primary : palette.muted, fontSize: data.buckets.length > 7 ? 9 : 10, fontWeight: index === selectedIndex ? "800" : "500" }}>{data.buckets.length > 7 && index % 2 === 1 && index !== selectedIndex ? "" : bucket.label}</Text>)}
      </View>
      <View style={{ borderRadius: 13, padding: 12, backgroundColor: palette.homeSubtle }}>
        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>{data.total > 0 ? `You logged ${formatDuration(data.total)} across ${data.activeDays} active ${data.activeDays === 1 ? "day" : "days"}. Your busiest period reached ${formatDuration(peak)}.` : "No coding activity is saved for this range yet."}</Text>
      </View>
    </Surface>
  );
}

function HighlightCard({ data, palette }: { data: ReturnType<typeof buildAnalytics>; palette: Palette }) {
  const best = data.bestDay;
  const change = data.hasPrevious && data.previousTotal > 0 ? Math.round((data.total - data.previousTotal) / data.previousTotal * 100) : null;
  return (
    <Surface palette={palette} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeMintSurface }}><ChartLineUpIcon color={palette.primary} size={26} weight="bold" /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: palette.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>Your strongest day</Text>
        <Text style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>{best ? new Date(`${best.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }) : "No activity yet"}</Text>
        <Text selectable style={{ color: palette.muted, fontSize: 12 }}>{best ? `${formatDuration(best.totalSeconds)} of coding` : "Your next coding day will appear here."}{change === null ? "" : ` · ${change >= 0 ? "+" : ""}${change}% vs prior period`}</Text>
      </View>
    </Surface>
  );
}

function BreakdownCard({ title, rows, palette }: { title: string; rows: Breakdown[]; palette: Palette }) {
  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  const colors = [palette.homeHero, palette.primary, palette.homeAmber, palette.muted];
  const visible = rows.slice(0, 4);
  return (
    <Surface palette={palette}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>{title}</Text>
        <Text style={{ color: palette.muted, fontSize: 11 }}>{rows.length} {title === "Active projects" ? rows.length === 1 ? "repository" : "repositories" : "recorded"}</Text>
      </View>
      {rows.length === 0 ? <Text style={{ color: palette.muted, fontSize: 13 }}>No {title.toLowerCase()} saved for this range.</Text> : <>
        {title === "Active projects" ? <View style={{ height: 9, borderRadius: 5, overflow: "hidden", flexDirection: "row", backgroundColor: palette.homeSubtle }}>{visible.map((row, index) => <View key={row.name} style={{ width: `${row.seconds / total * 100}%`, height: 9, backgroundColor: colors[index] }} />)}</View> : null}
        {visible.map((row, index) => {
          const share = row.seconds / total;
          return <View key={row.name} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors[index] }} />
              <Text numberOfLines={1} style={{ flex: 1, color: palette.text, fontSize: 12, fontWeight: "700" }}>{row.name}</Text>
              <Text selectable style={{ color: palette.muted, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatDuration(row.seconds)}</Text>
              <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "800", width: 37, textAlign: "right" }}>{Math.round(share * 100)}%</Text>
            </View>
            <AnimatedProgressBar value={share} color={colors[index]} height={5} style={{ backgroundColor: palette.homeSubtle }} />
          </View>;
        })}
      </>}
    </Surface>
  );
}

export function AnalyticsDashboard() {
  const palette = usePalette();
  const { offset, onScroll } = useAndroidPageScroll();
  const insets = useSafeAreaInsets();
  const { summaries, loading, error } = useDashboard();
  const [range, setRange] = useState<AnalyticsRange>(30);
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const today = useMemo(() => new Date(), []);
  const data = useMemo(() => buildAnalytics(summaries, range, today), [summaries, range, today]);
  const peakIndex = data.buckets.reduce((best, bucket, index) => bucket.seconds > (data.buckets[best]?.seconds ?? -1) ? index : best, 0);
  const selectedIndex = selectedBucket !== null && selectedBucket < data.buckets.length ? selectedBucket : peakIndex;
  async function shareReport() {
    const period = range === "all" ? "all saved activity" : `the last ${range} days`;
    const message = `WakaBoard · ${period}\nCoding time: ${formatDuration(data.total)}\nActive days: ${data.activeDays}/${data.days}\nDaily pace: ${formatDuration(data.total / data.days)}\nPeak streak: ${data.peakStreak} days`;
    try {
      await Share.share({ message, title: "WakaBoard coding summary" });
    } catch {
      Alert.alert("Unable to share", "Please try sharing your summary again.");
    }
  }
  return (
    <AndroidPageFrame title="Analytics" offset={offset}>
    <Animated.ScrollView
      contentInsetAdjustmentBehavior="automatic"
      onScroll={process.env.EXPO_OS === "android" ? onScroll : undefined}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(32, insets.bottom + 24) }}
    >
      <AndroidLargeTitle title="Analytics" offset={offset} />
      <RangePicker range={range} onChange={(next) => { setRange(next); setSelectedBucket(null); }} />
      <DigestCard data={data} range={range} palette={palette} />
      {loading ? <Text style={{ color: palette.muted, fontSize: 13 }}>Loading saved activity…</Text> : error ? <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 13 }}>{error}</Text> : null}
      <CadenceCard data={data} selectedIndex={selectedIndex} onSelect={(index) => { if (index !== selectedIndex) void HapticPreset.selection(); setSelectedBucket(index); }} palette={palette} />
      <HighlightCard data={data} palette={palette} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 }}>
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 19, fontWeight: "800" }}>Habit distribution</Text>
        <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "700" }}>3 categories</Text>
      </View>
      <BreakdownCard title="Active projects" rows={data.projects} palette={palette} />
      <BreakdownCard title="Languages" rows={data.languages} palette={palette} />
      <BreakdownCard title="Environments" rows={data.editors} palette={palette} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 22, backgroundColor: palette.homeSurface }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeMintSurface }}><ChartLineUpIcon color={palette.primary} size={20} weight="bold" /></View>
        <View style={{ flex: 1, gap: 3 }}><Text style={{ color: palette.text, fontSize: 14, fontWeight: "800" }}>Your coding report</Text><Text style={{ color: palette.muted, fontSize: 11 }}>Share the summary for this range</Text></View>
        <ScaleButton label="Share coding report" onPress={() => void shareReport()} glass="clear" style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: palette.card }}><ShareNetworkIcon color={palette.primary} size={20} weight="bold" /></ScaleButton>
      </View>
      <ScaleButton label="Open activity timeline" onPress={() => router.push("/activity")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 16, minHeight: 68, borderRadius: 22, backgroundColor: palette.homeSurface }}>
        <View style={{ flex: 1, gap: 3 }}><Text style={{ color: palette.text, fontSize: 15, fontWeight: "800" }}>Activity timeline</Text><Text style={{ color: palette.muted, fontSize: 11 }}>Explore your saved coding days</Text></View>
        <CaretRightIcon color={palette.primary} size={20} weight="bold" />
      </ScaleButton>
    </Animated.ScrollView>
    </AndroidPageFrame>
  );
}
