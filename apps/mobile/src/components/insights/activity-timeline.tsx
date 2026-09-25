import { formatDuration, goalProgress, localDateKey, type Breakdown, type DailySummary } from "@wakaboard/core";
import { router } from "expo-router";
import { CalendarBlankIcon } from "phosphor-react-native/src/icons/CalendarBlank";
import { CaretDownIcon } from "phosphor-react-native/src/icons/CaretDown";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ClockClockwiseIcon } from "phosphor-react-native/src/icons/ClockClockwise";
import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { useMemo, useRef, useState } from "react";
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, Share, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboard } from "../../data/dashboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../data/wakatime-client";
import { usePalette } from "../../theme";
import { ScaleButton } from "../ui/scale-button";

type Palette = ReturnType<typeof usePalette>;

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
  const circumference = 2 * Math.PI * 21;
  return <View style={{ width: 62, height: 62, alignItems: "center", justifyContent: "center" }}>
    <Svg width={62} height={62} viewBox="0 0 62 62" accessibilityLabel={`${Math.round(progress * 100)} percent of daily goal`}>
      <Circle cx="31" cy="31" r="21" fill="none" stroke={palette.homeHeroTrack} strokeWidth="5" />
      <Circle cx="31" cy="31" r="21" fill="none" stroke={palette.homeAmber} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${circumference * progress} ${circumference}`} transform="rotate(-90 31 31)" />
    </Svg>
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
  const listRef = useRef<FlatList<string>>(null);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={() => listRef.current?.scrollToOffset({ offset: 0, animated: false })}>
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: palette.modalBackdrop }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close date picker" onPress={onClose} style={{ flex: 1 }} />
      <View style={{ maxHeight: "70%", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: palette.background, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 }}>
          <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 19, fontWeight: "800" }}>Choose a saved day</Text>
          <ScaleButton label="Close date picker" onPress={onClose} style={{ padding: 8 }}><Text style={{ color: palette.primary, fontSize: 14, fontWeight: "700" }}>Done</Text></ScaleButton>
        </View>
        <FlatList
          ref={listRef}
          data={dates}
          keyExtractor={(key) => key}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item }) => <ScaleButton label={`Show ${dateLabel(item, todayKey)}`} selected={item === selectedKey} onPress={() => onSelect(item)} style={{ paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderRadius: 16, backgroundColor: item === selectedKey ? palette.homeMintSurface : palette.homeSurface }}>
            <Text style={{ color: palette.text, fontSize: 14, fontWeight: item === selectedKey ? "800" : "600" }}>{dateLabel(item, todayKey)}</Text>
          </ScaleButton>}
        />
      </View>
    </View>
  </Modal>;
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
        {projects.slice(0, 4).map((project, index) => <View key={project.name} style={{ width: `${projectTotal > 0 ? project.seconds / projectTotal * 100 : 0}%`, backgroundColor: colors[index] }} />)}
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
      <View style={{ height: 4, borderRadius: 2, backgroundColor: palette.homeSubtle }}><View style={{ width: `${Math.round(row.seconds / total * 100)}%`, height: 4, borderRadius: 2, backgroundColor: palette.primary }} /></View>
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
            <View style={{ height: 6, borderRadius: 4, backgroundColor: palette.homeSubtle }}><View style={{ width: `${Math.min(100, Math.round(share * 100))}%`, height: 6, borderRadius: 4, backgroundColor: index === 1 ? palette.homeAmber : palette.primary }} /></View>
            <Text style={{ color: palette.muted, fontSize: 11 }}>{Math.round(share * 100)}% of this day&apos;s coding time</Text>
          </View>
        </View>
      </View>;
    })}
  </View>;
}

export function ActivityTimeline() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { summaries, goalSeconds, syncing, syncWakaTime, refresh } = useDashboard();
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
    setSelectedKey(key);
    setProjectFilter(null);
    setPickerOpen(false);
    filterScroll.current?.scrollTo({ x: 0, animated: false });
  }

  async function refreshActivity() {
    if (wakatimeConnectionAvailable && await authClient.getCookie()) await syncWakaTime();
    else await refresh();
  }

  async function shareDay() {
    if (!summary) return;
    const projectLines = projects.slice(0, 5).map((project) => `• ${project.name}: ${formatDuration(project.seconds)}`).join("\n");
    const message = `WakaBoard · ${dateLabel(selectedKey, todayKey)}\nCoding time: ${formatDuration(summary.totalSeconds)}\n${projectLines}`;
    try {
      await Share.share({ message, title: "WakaBoard daily activity" });
    } catch {
      Alert.alert("Unable to share", "Please try sharing your activity again.");
    }
  }

  return <>
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => void refreshActivity()} tintColor={palette.primary} />}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 17, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(36, insets.bottom + 24) }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <ScaleButton label="Previous day" disabled={selectedKey <= earliestKey} onPress={() => selectDay(adjacentDay(selectedKey, -1))} style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeSubtle }}><CaretLeftIcon color={palette.text} size={17} weight="bold" /></ScaleButton>
        <ScaleButton label="Choose a saved day" onPress={() => setPickerOpen(true)} style={{ minHeight: 38, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: palette.homeSubtle }}>
          <CalendarBlankIcon color={palette.primary} size={16} weight="bold" />
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 12, fontWeight: "800" }}>{dateLabel(selectedKey, todayKey)}</Text>
          <CaretDownIcon color={palette.muted} size={13} weight="bold" />
        </ScaleButton>
        <ScaleButton label="Next day" disabled={selectedKey >= todayKey} onPress={() => selectDay(adjacentDay(selectedKey, 1))} style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeSubtle }}><CaretRightIcon color={palette.text} size={17} weight="bold" /></ScaleButton>
        <View style={{ flex: 1 }} />
        <ScaleButton label="Share this day's activity" disabled={!summary} onPress={() => void shareDay()} glass="clear" style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeSubtle }}><ShareNetworkIcon color={palette.primary} size={18} weight="bold" /></ScaleButton>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.homeMintSurface }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.success }} />
          <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "700" }}>{summary?.source === "sample" ? "Previewing sample data" : summary ? "Saved on this device" : "No activity saved"}</Text>
        </View>
        <Text style={{ color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>{summary ? "RECORDED" : "EMPTY DAY"}</Text>
      </View>
      <DayHero summary={summary} goalSeconds={goalSeconds} palette={palette} />
      {summary && projects.length ? <>
        <ScrollView ref={filterScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
          <ScaleButton label="Show all project activity" selected={!projectFilter} onPress={() => setProjectFilter(null)} style={{ minHeight: 38, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: !projectFilter ? palette.primary : palette.homeSubtle }}><Text style={{ color: !projectFilter ? palette.onPrimary : palette.text, fontSize: 11, fontWeight: "800" }}>All activity</Text></ScaleButton>
          {projects.map((project) => <ScaleButton key={project.name} label={`Show ${project.name} activity`} selected={projectFilter === project.name} onPress={() => setProjectFilter(project.name)} style={{ minHeight: 38, maxWidth: 200, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center", backgroundColor: projectFilter === project.name ? palette.primary : palette.homeSubtle }}><Text numberOfLines={1} style={{ color: projectFilter === project.name ? palette.onPrimary : palette.text, fontSize: 11, fontWeight: "700" }}>{project.name} · {formatDuration(project.seconds)}</Text></ScaleButton>)}
        </ScrollView>
        <View style={{ gap: 4 }}><Text accessibilityRole="header" style={{ color: palette.text, fontSize: 19, fontWeight: "800" }}>Project activity</Text><Text style={{ color: palette.muted, fontSize: 11 }}>By coding time on this day</Text></View>
        <ProjectTimeline projects={visibleProjects} totalSeconds={summary.totalSeconds} palette={palette} />
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
      <ScaleButton label="Refresh activity" onPress={() => void refreshActivity()} style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, padding: 8 }}><ClockClockwiseIcon color={palette.primary} size={16} weight="bold" /><Text style={{ color: palette.primary, fontSize: 11, fontWeight: "700" }}>Refresh activity</Text></ScaleButton>
    </ScrollView>
    <DayPicker visible={pickerOpen} dates={dates} selectedKey={selectedKey} todayKey={todayKey} onSelect={selectDay} onClose={() => setPickerOpen(false)} palette={palette} />
  </>;
}
