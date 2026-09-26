import { Text } from "../ui/app-text";
import { formatDuration, goalProgress, localDateKey, type Breakdown, type DailySummary } from "@wakaboard/core";
import { BottomSheetModal, BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { router } from "expo-router";
import { CalendarBlankIcon } from "phosphor-react-native/src/icons/CalendarBlank";
import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboard } from "../../data/dashboard-context";
import { HapticPreset } from "../../constants/haptics";
import { runManualRefresh, type RefreshOutcome } from "../../haptic-actions";
import { getConnectionMode, wakatimeConnectionAvailable } from "../../data/wakatime-client";
import { usePalette } from "../../theme";
import { ScaleButton } from "../ui/scale-button";
import { RefreshIndicator } from "../ui/refresh-indicator";
import { usePullRefreshFeedback } from "../ui/use-pull-refresh-feedback";
import { AnimatedProgressBar, AnimatedProgressRing } from "../ui/animated-progress";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../navigation/android-page-header";

type Palette = ReturnType<typeof usePalette>;
const shareSlots = ["first", "second", "third", "fourth"] as const;

function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

function adjacentDay(key: string, direction: -1 | 1): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + direction);
  return localDateKey(date);
}

function dateLabel(key: string, todayKey: string): string {
  const label = dateFromKey(key).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return key === todayKey ? `Today, ${label}` : label;
}

function ProgressRing({ progress, palette }: { progress: number; palette: Palette }) {
  return <View style={{ width: 62, height: 62, alignItems: "center", justifyContent: "center" }}>
    <AnimatedProgressRing value={progress} size={62} radius={21} strokeWidth={5} trackColor={palette.homeHeroTrack} color={palette.homeAmber} label={`${Math.round(progress * 100)} percent of daily goal`} />
    <Text style={{ position: "absolute", color: palette.homeHeroText, fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{Math.round(progress * 100)}%</Text>
  </View>;
}

function DayPicker({ visible, dates, selectedKey, todayKey, onSelect, onClose, palette }: {
  visible: boolean;
  dates: string[];
  selectedKey: string;
  todayKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
  palette: Palette;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const listRef = useRef<FlatList<string>>(null);
  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  return <BottomSheetModal ref={sheetRef} snapPoints={["50%", "90%"]} enablePanDownToClose onDismiss={onClose} backgroundStyle={{ backgroundColor: palette.background }}>
    <BottomSheetView style={{ flex: 1, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }}>
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 19, fontWeight: "800" }}>Choose a saved day</Text>
        <ScaleButton label="Close date picker" onPress={onClose} style={{ padding: 8 }}><Text style={{ color: palette.primary, fontSize: 14, fontWeight: "700" }}>Done</Text></ScaleButton>
      </View>
      <FlatList
        ref={listRef}
        style={{ flex: 1 }}
        data={dates}
        keyExtractor={(key) => key}
        renderItem={({ item }) => <ScaleButton label={`Show ${dateLabel(item, todayKey)}`} selected={item === selectedKey} onPress={() => onSelect(item)} style={{ paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderRadius: 16, backgroundColor: item === selectedKey ? palette.homeMintSurface : palette.homeSurface }}>
          <Text style={{ color: palette.text, fontSize: 14, fontWeight: item === selectedKey ? "800" : "600" }}>{dateLabel(item, todayKey)}</Text>
        </ScaleButton>}
      />
    </BottomSheetView>
  </BottomSheetModal>;
}

function ProjectShareSegment({ share, color }: { share: number; color: string }) {
  const reducedMotion = useReducedMotion();
  const width = useSharedValue(share);
  useEffect(() => {
    width.value = reducedMotion ? share : withTiming(share, { duration: 360, easing: Easing.out(Easing.cubic) });
  }, [reducedMotion, share, width]);
  const style = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, width.value * 100))}%` }));
  return <Animated.View style={[{ height: 8, backgroundColor: color }, style]} />;
}

function DayHero({ summary, goalSeconds, palette }: { summary: DailySummary | undefined; goalSeconds: number; palette: Palette }) {
  const projects = [...(summary?.projects ?? [])].sort((a, b) => b.seconds - a.seconds);
  const projectTotal = projects.reduce((sum, project) => sum + project.seconds, 0);
  const progress = goalProgress(summary?.totalSeconds ?? 0, goalSeconds);
  const colors = [palette.homeAmber, palette.mint, palette.accent, palette.homeHeroMuted];
  return <View style={{ padding: 20, gap: 20, borderRadius: 28, backgroundColor: palette.homeHero, borderCurve: "continuous" }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Text style={{ color: palette.homeHeroMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }}>TOTAL RECORDED TIME</Text>
        <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: palette.homeHeroText, fontSize: 35, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(summary?.totalSeconds ?? 0)}</Text>
        <Text style={{ color: palette.homeHeroMuted, fontSize: 12 }}>of {formatDuration(goalSeconds)} daily goal</Text>
      </View>
      <ProgressRing progress={progress} palette={palette} />
    </View>
    <View style={{ flexDirection: "row", gap: 8, padding: 12, borderRadius: 17, backgroundColor: palette.homeHeroChip }}>
      {([
        ["Projects", summary?.projects.length ?? 0],
        ["Languages", summary?.languages.length ?? 0],
        ["Editors", summary?.editors.length ?? 0],
      ] as const).map(([label, value]) => <View key={label} style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: palette.homeHeroMuted, fontSize: 10 }}>{label}</Text>
        <Text selectable style={{ color: palette.homeHeroText, fontSize: 19, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{value}</Text>
      </View>)}
    </View>
    <View style={{ gap: 8 }}>
      <View style={{ height: 8, flexDirection: "row", borderRadius: 4, overflow: "hidden", backgroundColor: palette.homeHeroTrack }}>
        {shareSlots.map((slot, index) => <ProjectShareSegment key={slot} share={projectTotal > 0 ? (projects[index]?.seconds ?? 0) / projectTotal : 0} color={colors[index]} />)}
      </View>
      <Text style={{ color: palette.homeHeroMuted, fontSize: 10 }}>{projects.length ? "Project share of recorded coding time" : "Project activity will appear after a sync"}</Text>
    </View>
  </View>;
}

function BreakdownGroup({ title, rows, palette }: { title: string; rows: Breakdown[]; palette: Palette }) {
  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  return <View style={{ flex: 1, minWidth: 0, gap: 9 }}>
    <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" }}>{title}</Text>
    {rows.length ? rows.slice(0, 3).map((row) => <View key={row.name} style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", gap: 5, justifyContent: "space-between" }}>
        <Text numberOfLines={1} style={{ color: palette.text, flex: 1, fontSize: 11, fontWeight: "600" }}>{row.name}</Text>
        <Text style={{ color: palette.primary, fontSize: 10, fontWeight: "800" }}>{Math.round(row.seconds / total * 100)}%</Text>
      </View>
      <AnimatedProgressBar value={row.seconds / total} color={palette.primary} height={4} style={{ backgroundColor: palette.homeSubtle }} />
    </View>) : <Text style={{ color: palette.muted, fontSize: 11 }}>No data</Text>}
  </View>;
}

function ProjectTimeline({ projects, totalSeconds, palette }: { projects: Breakdown[]; totalSeconds: number; palette: Palette }) {
  return <View style={{ gap: 18, paddingLeft: 4 }}>
    {projects.map((project, index) => {
      const share = totalSeconds > 0 ? project.seconds / totalSeconds : 0;
      return <View key={project.name} style={{ paddingLeft: 30, position: "relative" }}>
        {index < projects.length - 1 ? <View style={{ position: "absolute", left: 7, top: 18, bottom: -20, width: 2, backgroundColor: palette.homeSubtle }} /> : null}
        <View style={{ position: "absolute", left: 0, top: 10, width: 16, height: 16, borderRadius: 8, backgroundColor: index === 0 ? palette.primary : index === 1 ? palette.homeAmber : palette.bar, borderWidth: 4, borderColor: palette.background }} />
        <View style={{ borderRadius: 21, padding: 16, gap: 13, backgroundColor: palette.card, borderCurve: "continuous" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text numberOfLines={1} style={{ color: palette.text, flex: 1, fontSize: 15, fontWeight: "800" }}>{project.name}</Text>
            <Text selectable style={{ color: palette.primary, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(project.seconds)}</Text>
          </View>
          <View style={{ gap: 6 }}>
            <AnimatedProgressBar value={share} color={index === 1 ? palette.homeAmber : palette.primary} height={6} style={{ backgroundColor: palette.homeSubtle }} />
            <Text style={{ color: palette.muted, fontSize: 11 }}>{Math.round(share * 100)}% of this day&apos;s coding time</Text>
          </View>
        </View>
      </View>;
    })}
  </View>;
}

export function ActivityTimeline() {
  const palette = usePalette();
  const reducedMotion = useReducedMotion();
  const { offset, onScroll } = useAndroidPageScroll();
  const insets = useSafeAreaInsets();
  const { summaries, goalSeconds, syncWakaTime, refresh } = useDashboard();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pull = usePullRefreshFeedback(offset, pullRefreshing);
  const todayKey = useMemo(() => localDateKey(new Date()), []);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const filterScroll = useRef<ScrollView>(null);
  const dates = useMemo(() => [...summaries].sort((a, b) => b.date.localeCompare(a.date)).map((day) => day.date), [summaries]);
  const earliestKey = dates.at(-1) ?? todayKey;
  const summary = summaries.find((day) => day.date === selectedKey);
  const projects = [...(summary?.projects ?? [])].sort((a, b) => b.seconds - a.seconds);
  const visibleProjects = projectFilter ? projects.filter((project) => project.name === projectFilter) : projects;

  function selectDay(key: string) {
    if (key !== selectedKey) void HapticPreset.selection();
    setSelectedKey(key);
    setProjectFilter(null);
    setPickerOpen(false);
    filterScroll.current?.scrollTo({ x: 0, animated: false });
  }

  function selectProject(name: string | null) {
    if (name === projectFilter) return;
    void HapticPreset.selection();
    setProjectFilter(name);
  }

  async function refreshActivity(): Promise<RefreshOutcome> {
    if (wakatimeConnectionAvailable && await getConnectionMode()) return syncWakaTime();
    await refresh();
    return "local";
  }

  function onPullRefresh() {
    setPullRefreshing(true);
    void runManualRefresh(refreshActivity, true).finally(() => setPullRefreshing(false));
  }

  function shareDay() {
    router.push({ pathname: "/share/daily", params: { date: selectedKey } });
  }

  return <AndroidPageFrame title="Activity" offset={offset} back>
    <Animated.ScrollView
      contentInsetAdjustmentBehavior="automatic"
      onScroll={process.env.EXPO_OS === "android" ? onScroll : undefined}
      onScrollBeginDrag={pull.onScrollBeginDrag}
      onTouchStart={pull.onTouchStart}
      onTouchMove={pull.onTouchMove}
      onTouchEnd={pull.onTouchEnd}
      onTouchCancel={pull.onTouchCancel}
      scrollEventThrottle={16}
      refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onPullRefresh} tintColor={palette.primary} colors={process.env.EXPO_OS === "android" ? [pullRefreshing ? "transparent" : palette.primary] : undefined} progressBackgroundColor={process.env.EXPO_OS === "android" ? pullRefreshing ? "transparent" : palette.card : undefined} progressViewOffset={process.env.EXPO_OS === "android" ? pullRefreshing ? -100 : insets.top + 8 : undefined} />}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 17, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(36, insets.bottom + 24) }}
    >
      <AndroidLargeTitle title="Activity" offset={offset} back />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <ScaleButton label="Previous day" disabled={selectedKey <= earliestKey} onPress={() => selectDay(adjacentDay(selectedKey, -1))} style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeSubtle }}><CaretLeftIcon color={palette.text} size={17} weight="bold" /></ScaleButton>
        <ScaleButton label="Choose a saved day" onPress={() => setPickerOpen(true)} style={{ minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: palette.homeSubtle }}>
          <CalendarBlankIcon color={palette.primary} size={16} weight="bold" />
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 12, fontWeight: "800" }}>{dateLabel(selectedKey, todayKey)}</Text>
          <CaretDownIcon color={palette.muted} size={13} weight="bold" />
        </ScaleButton>
        <ScaleButton label="Next day" disabled={selectedKey >= todayKey} onPress={() => selectDay(adjacentDay(selectedKey, 1))} style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeSubtle }}><CaretRightIcon color={palette.text} size={17} weight="bold" /></ScaleButton>
        <View style={{ flex: 1 }} />
        <ScaleButton label="Share this day's activity" disabled={!summary || summary.source !== "wakatime"} onPress={shareDay} glass="clear" style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeSubtle }}><ShareNetworkIcon color={palette.primary} size={18} weight="bold" /></ScaleButton>
      </View>
      {summary?.source === "sample" && <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>SAMPLE ACTIVITY</Text>}
      <DayHero summary={summary} goalSeconds={goalSeconds} palette={palette} />
      {summary && projects.length ? <>
        <ScrollView ref={filterScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <ScaleButton label="Show all project activity" selected={!projectFilter} onPress={() => selectProject(null)} style={{ minHeight: 38, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: !projectFilter ? palette.primary : palette.homeSubtle }}><Text style={{ color: !projectFilter ? palette.onPrimary : palette.text, fontSize: 11, fontWeight: "800" }}>All activity</Text></ScaleButton>
          {projects.map((project) => <ScaleButton key={project.name} label={`Show ${project.name} activity`} selected={projectFilter === project.name} onPress={() => selectProject(project.name)} style={{ minHeight: 38, maxWidth: 200, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: projectFilter === project.name ? palette.primary : palette.homeSubtle }}><Text numberOfLines={1} style={{ color: projectFilter === project.name ? palette.onPrimary : palette.text, fontSize: 11, fontWeight: "700" }}>{project.name} · {formatDuration(project.seconds)}</Text></ScaleButton>)}
        </ScrollView>
        <View style={{ gap: 4 }}><Text accessibilityRole="header" style={{ color: palette.text, fontSize: 19, fontWeight: "800" }}>Project activity</Text><Text style={{ color: palette.muted, fontSize: 11 }}>By coding time on this day</Text></View>
        <Animated.View key={`${selectedKey}-${projectFilter ?? "all"}`} entering={reducedMotion ? undefined : FadeIn.duration(180)}>
          <ProjectTimeline projects={visibleProjects} totalSeconds={summary.totalSeconds} palette={palette} />
        </Animated.View>
        <View style={{ borderRadius: 23, padding: 17, gap: 15, backgroundColor: palette.card }}>
          <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 15, fontWeight: "800" }}>Tools used across the day</Text>
          <View style={{ flexDirection: "row", gap: 17 }}>
            <BreakdownGroup title="Languages" rows={summary.languages} palette={palette} />
            <BreakdownGroup title="Editors" rows={summary.editors} palette={palette} />
          </View>
        </View>
      </> : <View style={{ borderRadius: 23, padding: 20, gap: 7, backgroundColor: palette.card }}><Text style={{ color: palette.text, fontSize: 16, fontWeight: "800" }}>{summary ? "No project details" : "A quiet day"}</Text><Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>{summary ? "No project breakdown was saved for this day." : "No coding activity is saved for this date. Choose another day or pull down to refresh."}</Text></View>}
      <ScaleButton label="Open Analytics" onPress={() => router.navigate("/(tabs)/(insights)")} glass="regular" style={{ minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, backgroundColor: palette.primary }}><Text style={{ color: palette.onPrimary, fontSize: 13, fontWeight: "800" }}>View Analytics</Text><CaretRightIcon color={palette.onPrimary} size={17} weight="bold" /></ScaleButton>
      <View style={{ alignItems: "center", gap: 5, paddingVertical: 8 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><LockKeyIcon color={palette.primary} size={14} weight="bold" /><Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>Private & offline first</Text></View><Text style={{ color: palette.muted, fontSize: 10, textAlign: "center" }}>Daily totals and breakdowns are cached locally.</Text></View>
    </Animated.ScrollView>
    <RefreshIndicator pulling={pull.pulling} refreshing={pullRefreshing} progress={pull.progress} color={palette.primary} />
    <DayPicker visible={pickerOpen} dates={dates} selectedKey={selectedKey} todayKey={todayKey} onSelect={selectDay} onClose={() => setPickerOpen(false)} palette={palette} />
  </AndroidPageFrame>;
}
