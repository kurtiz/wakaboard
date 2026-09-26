import { Text } from "../ui/app-text";
import { formatDuration, goalProgress, localDateKey, type Breakdown, type DailySummary } from "@wakaboard/core";
import { Link, router } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ChartLineUpIcon } from "phosphor-react-native/src/icons/ChartLineUp";
import { FireIcon } from "phosphor-react-native/src/icons/Fire";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { OnboardingButton } from "../onboarding/onboarding-button";
import { ChevronLink } from "../ui/chevron-link";
import { LoadingIndicator } from "../ui/loading-indicator";
import { RefreshIndicator } from "../ui/refresh-indicator";
import { BrandMark } from "../ui/brand-mark";
import { AnimatedHeightBar, AnimatedProgressBar, AnimatedProgressRing } from "../ui/animated-progress";
import { BarChartGuides } from "../ui/bar-chart-guides";
import { useDashboard } from "../../data/dashboard-context";
import { runManualRefresh, type RefreshOutcome } from "../../haptic-actions";
import { useLeaderboards } from "../../data/leaderboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../data/wakatime-client";
import { usePalette } from "../../theme";
import { usePressScale } from "../ui/use-press-scale";
import { MemberAvatar } from "../leaderboard/member-avatar";
import type { MemberProfile } from "../../data/leaderboards";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../navigation/android-page-header";

type Palette = ReturnType<typeof usePalette>;
type Day = { key: string; label: string; seconds: number };
const android = process.env.EXPO_OS === "android";

function daysForWeek(today: Date, summaries: DailySummary[]): Day[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = localDateKey(date);
    return { key, label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), seconds: summaries.find((day) => day.date === key)?.totalSeconds ?? 0 };
  });
}

function codingStreak(today: Date, summaries: DailySummary[]): number {
  const coded = new Set(summaries.filter((day) => day.totalSeconds > 0).map((day) => day.date));
  const date = new Date(today);
  if (!coded.has(localDateKey(date))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (coded.has(localDateKey(date))) {
    count += 1;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

function SurfaceCard({ children, palette, style }: { children: ReactNode; palette: Palette; style?: object }) {
  return <View style={[{ backgroundColor: palette.homeSurface, borderRadius: android ? 28 : 30, padding: 20, gap: 17, borderCurve: "continuous" }, style]}>{children}</View>;
}

function SectionTitle({ title, kicker, trailing, palette }: { title: string; kicker?: string; trailing?: ReactNode; palette: Palette }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        {kicker ? <Text style={{ color: palette.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>{kicker}</Text> : null}
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 22, fontWeight: "700" }}>{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

function HomeHeader({ today, name, profile, syncing, sample, hasActivity, palette }: { today: Date; name: string | null; profile: MemberProfile | null; syncing: boolean; sample: boolean; hasActivity: boolean; palette: Palette }) {
  const profilePress = usePressScale();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const status = syncing ? "Syncing WakaTime" : sample ? "Previewing sample data" : hasActivity ? "Saved on this device" : "Ready to sync";
  return (
    <View style={{ gap: 19 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <BrandMark size={32} />
          <Text style={{ color: palette.text, fontSize: 21, fontWeight: "800" }}>WakaBoard</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Animated.View style={profilePress.style}>
            <Link href="/profile/current" asChild><Pressable accessibilityRole="button" accessibilityLabel="Open your WakaTime profile" onPressIn={profilePress.onPressIn} onPressOut={profilePress.onPressOut} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: palette.homeHero, alignItems: "center", justifyContent: "center" }}><MemberAvatar id={profile?.id ?? "current"} name={profile?.name ?? name ?? "You"} photo={profile?.photo} size={38} dark fallbackText="YOU" /></Pressable></Link>
          </Animated.View>
        </View>
      </View>
      <View style={{ gap: 7 }}>
        <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.3, textTransform: "uppercase" }}>
          {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </Text>
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 }}>
          {greeting}{name ? `, ${name}` : ""}
        </Text>
        {android ? <Text style={{ color: palette.muted, fontSize: 14 }}>Your coding day at a glance.</Text> : null}
        <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, backgroundColor: palette.homeMintSurface, paddingHorizontal: 11, paddingVertical: 6, marginTop: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.success }} />
          <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "700" }}>{status}</Text>
        </View>
      </View>
    </View>
  );
}

function GoalRing({ progress, goalSeconds, palette }: { progress: number; goalSeconds: number; palette: Palette }) {
  return (
    <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
      <AnimatedProgressRing value={progress} size={100} radius={39} strokeWidth={8} trackColor={palette.homeHeroTrack} color={palette.homeAmber} label={`${Math.round(progress * 100)} percent of daily goal`} />
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ color: palette.homeHeroText, fontSize: 19, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{Math.round(progress * 100)}%</Text>
        <Text style={{ color: palette.homeHeroMuted, fontSize: 9, fontWeight: "700" }}>OF {formatDuration(goalSeconds).toUpperCase()}</Text>
      </View>
    </View>
  );
}

function HeroCard({ total, goalSeconds, progress, streak, dailyAverage, palette }: { total: number; goalSeconds: number; progress: number; streak: number; dailyAverage: number; palette: Palette }) {
  const remaining = Math.max(0, goalSeconds - total);
  return (
    <View style={{ backgroundColor: palette.homeHero, borderRadius: 30, padding: 20, gap: 22, borderCurve: "continuous" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Text numberOfLines={1} style={{ color: palette.homeHeroMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, flexShrink: 1 }}>TODAY · CODING TIME</Text>
        {streak > 0 ? <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, backgroundColor: palette.homeHeroChip, paddingHorizontal: 10, paddingVertical: 6 }}><FireIcon color={palette.homeAmber} size={14} weight="fill" /><Text numberOfLines={1} style={{ color: palette.homeHeroText, fontSize: 11, fontWeight: "800" }}>{streak}-day streak</Text></View> : null}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text selectable style={{ color: palette.homeHeroText, fontSize: 43, lineHeight: 51, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: -1.5 }}>{formatDuration(total)}</Text>
          <Text style={{ color: palette.homeHeroMuted, fontSize: 12 }}>{total > 0 ? `${formatDuration(remaining)} left to your goal` : "Your day is ready to begin"}</Text>
        </View>
        <GoalRing progress={progress} goalSeconds={goalSeconds} palette={palette} />
      </View>
      {android ? (
        <View style={{ flexDirection: "row", gap: 9 }}>
          <View style={{ flex: 1, backgroundColor: palette.homeHeroChip, borderRadius: 16, padding: 11, gap: 4 }}><Text style={{ color: palette.homeHeroMuted, fontSize: 11 }}>Active day average</Text><Text selectable style={{ color: palette.homeHeroText, fontWeight: "800", fontSize: 15 }}>{formatDuration(dailyAverage)}</Text></View>
          <View style={{ flex: 1, backgroundColor: palette.homeHeroChip, borderRadius: 16, padding: 11, gap: 4 }}><Text style={{ color: palette.homeHeroMuted, fontSize: 11 }}>Remaining</Text><Text selectable style={{ color: palette.homeHeroText, fontWeight: "800", fontSize: 15 }}>{formatDuration(remaining)}</Text></View>
        </View>
      ) : (
        <View style={{ gap: 9 }}>
          <AnimatedProgressBar value={progress} color={palette.homeAmber} height={6} style={{ backgroundColor: palette.homeHeroTrack }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: palette.homeHeroMuted, fontSize: 11 }}>Active day average {formatDuration(dailyAverage)}</Text><ChevronLink href="/(tabs)/(insights)" label="Details" color={palette.homeHeroText} fontSize={11} /></View>
        </View>
      )}
    </View>
  );
}

function GoalBooster({ remaining, palette }: { remaining: number; palette: Palette }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || remaining <= 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 17, backgroundColor: palette.homeAmberSurface }}>
      <Text style={{ fontSize: 19 }}>◎</Text>
      <Text style={{ color: palette.scheme === "dark" ? palette.homeHeroText : palette.homeAmberText, flex: 1, fontSize: 13, lineHeight: 18 }}><Text style={{ fontWeight: "800" }}>{formatDuration(remaining)} left</Text> to reach your goal today.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss goal reminder" onPress={() => setDismissed(true)} hitSlop={10}><Text style={{ color: palette.muted, fontSize: 20 }}>×</Text></Pressable>
    </View>
  );
}

function WeeklyCard({ days, total, palette }: { days: Day[]; total: number; palette: Palette }) {
  const max = Math.max(1, ...days.map((day) => day.seconds));
  const activeDays = days.filter((day) => day.seconds > 0).length;
  const peak = Math.max(...days.map((day) => day.seconds));
  return (
    <SurfaceCard palette={palette}>
      <SectionTitle title="This Week" kicker="Activity distribution" trailing={<ChevronLink href="/(tabs)/(insights)" label="Analytics" color={palette.primary} fontSize={12} />} palette={palette} />
      {android ? <Text style={{ color: palette.muted, fontSize: 12, marginTop: -14 }}>{formatDuration(total)} total · Active day average {formatDuration(activeDays ? total / activeDays : 0)}</Text> : null}
      <View style={{ height: 132 }}>
        <BarChartGuides maximumSeconds={max} top={12} height={82} left={47} lineColor={palette.border} labelColor={palette.muted} />
        <View style={{ position: "absolute", top: 12, left: 47, right: 0, height: 82, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        {days.map((day, index) => {
          const today = index === days.length - 1;
          const peakDay = day.seconds > 0 && day.seconds === peak && !today;
          const color = peakDay ? palette.homeAmber : today ? palette.homeHero : day.seconds > 0 && android ? palette.primary : palette.track;
          const height = Math.max(6, Math.round((day.seconds / max) * 82));
          return <View key={day.key} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
            <AnimatedHeightBar height={height} color={color} accessibilityLabel={`${day.label}: ${formatDuration(day.seconds)}`} style={{ width: "100%", maxWidth: 34, borderRadius: 999 }} />
          </View>;
        })}
        </View>
        <View style={{ position: "absolute", top: 103, left: 47, right: 0, flexDirection: "row", gap: 8 }}>
          {days.map((day, index) => <Text key={day.key} style={{ flex: 1, textAlign: "center", color: index === days.length - 1 ? palette.primary : palette.muted, fontSize: 11, fontWeight: index === days.length - 1 ? "800" : "600" }}>{day.label}</Text>)}
        </View>
      </View>
      {!android ? <View style={{ backgroundColor: palette.homeSubtle, borderRadius: 13, padding: 12 }}><Text style={{ color: palette.muted, fontSize: 12, lineHeight: 17 }}><Text style={{ color: palette.text, fontWeight: "800" }}>{formatDuration(total)}</Text> across {activeDays} active {activeDays === 1 ? "day" : "days"} this week.</Text></View> : null}
      <ChevronLink href="/share/coding-week" label="Create share card" color={palette.primary} fontSize={13} style={{ alignSelf: "flex-end", paddingVertical: 8 }} />
    </SurfaceCard>
  );
}

function BreakdownCard({ title, kicker, rows, palette }: { title: string; kicker?: string; rows: Breakdown[]; palette: Palette }) {
  const ordered = [...rows].sort((a, b) => b.seconds - a.seconds).slice(0, android ? 4 : 3);
  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  return (
    <SurfaceCard palette={palette}>
      <SectionTitle title={title} kicker={kicker} trailing={title === "Languages" ? <ChevronLink href="/activity" label="Details" color={palette.primary} fontSize={12} /> : <Text style={{ color: palette.muted, fontSize: 11 }}>{rows.length} total</Text>} palette={palette} />
      {ordered.length === 0 ? <Text style={{ color: palette.muted, fontSize: 13 }}>No {title.toLowerCase()} recorded today.</Text> : ordered.map((row, index) => {
        const share = total ? row.seconds / total : 0;
        const color = index === 2 ? palette.homeAmber : index === 3 ? palette.muted : index === 1 ? palette.bar : palette.homeHero;
        return <View key={row.name} style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
            <Text numberOfLines={1} style={{ color: palette.text, flex: 1, fontSize: 13, fontWeight: "700" }}>{row.name}</Text>
            <Text selectable style={{ color: palette.muted, fontSize: 11, fontVariant: ["tabular-nums"] }}>{formatDuration(row.seconds)}</Text>
            <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "800", width: 34, textAlign: "right" }}>{Math.round(share * 100)}%</Text>
          </View>
          <AnimatedProgressBar value={share} color={color} height={6} style={{ backgroundColor: palette.homeSubtle }} />
        </View>;
      })}
    </SurfaceCard>
  );
}

function EditorsCard({ rows, palette }: { rows: Breakdown[]; palette: Palette }) {
  const ordered = [...rows].sort((a, b) => b.seconds - a.seconds).slice(0, 3);
  const total = rows.reduce((sum, row) => sum + row.seconds, 0);
  const colors = [palette.homeHero, palette.homeAmber, palette.muted];
  return (
    <SurfaceCard palette={palette}>
      <SectionTitle title="Editors" trailing={<Text style={{ color: palette.muted, fontSize: 11 }}>{rows.length} {rows.length === 1 ? "app" : "apps"} today</Text>} palette={palette} />
      {ordered.length === 0 ? <Text style={{ color: palette.muted, fontSize: 13 }}>No editors recorded today.</Text> : <>
        <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: palette.homeSubtle, gap: 2 }}>{ordered.map((row, index) => <View key={row.name} style={{ width: `${Math.max(0, Math.round((row.seconds / Math.max(1, total)) * 100) - 1)}%`, backgroundColor: colors[index] }} />)}</View>
        <View style={{ flexDirection: "row", gap: 9, flexWrap: "wrap" }}>{ordered.map((row, index) => <View key={row.name} style={{ flexGrow: 1, minWidth: 90, gap: 3, backgroundColor: android ? palette.card : "transparent", borderRadius: 12, padding: android ? 10 : 0 }}><Text numberOfLines={1} style={{ color: colors[index], fontSize: 12, fontWeight: "800" }}>● {row.name}</Text><Text selectable style={{ color: palette.muted, fontSize: 11 }}>{formatDuration(row.seconds)} · {Math.round((row.seconds / Math.max(1, total)) * 100)}%</Text></View>)}</View>
      </>}
    </SurfaceCard>
  );
}

function WeeklyInsight({ days, palette }: { days: Day[]; palette: Palette }) {
  const press = usePressScale();
  const peak = days.reduce<Day | null>((best, day) => !best || day.seconds > best.seconds ? day : best, null);
  if (!peak || peak.seconds <= 0) return null;
  const weekday = new Date(`${peak.key}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" });
  return (
    <Animated.View style={[press.style, { width: "100%" }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Best coding day: ${weekday}, ${formatDuration(peak.seconds)}. See weekly insights`} onPress={() => router.push("/(tabs)/(insights)")} onPressIn={press.onPressIn} onPressOut={press.onPressOut} style={({ pressed }) => ({ width: "100%", minHeight: 78, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24, backgroundColor: palette.homeSurface, opacity: pressed ? 0.76 : 1 })}>
        <View style={{ width: 42, height: 42, borderRadius: 16, backgroundColor: palette.homeMintSurface, alignItems: "center", justifyContent: "center" }}><ChartLineUpIcon color={palette.primary} size={22} weight="bold" /></View>
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15, fontWeight: "800" }}>Best coding day</Text>
          <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 12 }}>{weekday} · {formatDuration(peak.seconds)} of coding</Text>
        </View>
        <CaretRightIcon color={palette.muted} size={20} weight="bold" />
      </Pressable>
    </Animated.View>
  );
}

function StandingCard({ palette }: { palette: Palette }) {
  const { boards, loading, error } = useLeaderboards();
  return (
    <SurfaceCard palette={palette}>
      <SectionTitle title="Your standing" kicker="Leaderboard" trailing={<ChevronLink href="/(tabs)/(leaderboard)" label="See leaders" color={palette.primary} fontSize={12} />} palette={palette} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        {(["country", "global"] as const).map((scope) => <View key={scope} style={{ flex: 1, gap: 5, borderRadius: 17, backgroundColor: palette.homeSubtle, padding: 13 }}><Text style={{ color: palette.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>{scope === "country" ? "Your country" : "Worldwide"}</Text><Text selectable style={{ color: palette.text, fontSize: 27, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{boards[scope] ? boards[scope].rank === null ? "—" : `#${boards[scope].rank}` : loading ? "…" : "—"}</Text><Text style={{ color: palette.muted, fontSize: 10 }}>{boards[scope]?.rank != null ? "This week" : boards[scope] ? "Not ranked" : "Unavailable"}</Text></View>)}
      </View>
      {error ? <Text style={{ color: palette.muted, fontSize: 11 }}>{error}</Text> : null}
    </SurfaceCard>
  );
}

export function HomeDashboard() {
  const palette = usePalette();
  const { offset, onScroll } = useAndroidPageScroll();
  const { summaries, goalSeconds, loading, error, syncing, syncError, addSample, refresh, syncWakaTime } = useDashboard();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { currentProfile, refresh: refreshLeaderboards } = useLeaderboards();
  const [name, setName] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const days = daysForWeek(today, summaries);
  const weekTotal = days.reduce((sum, day) => sum + day.seconds, 0);
  const activeDays = days.filter((day) => day.seconds > 0).length;
  const dailyAverage = activeDays ? weekTotal / activeDays : 0;
  const summary = summaries.find((day) => day.date === localDateKey(today));
  const total = summary?.totalSeconds ?? 0;
  const progress = goalProgress(total, goalSeconds);
  const remaining = Math.max(0, goalSeconds - total);
  const sample = summaries.some((day) => day.source === "sample");
  const streak = codingStreak(today, summaries);

  useEffect(() => {
    void authClient.getSession().then(({ data }) => setName(data?.user.name?.split(" ")[0] ?? null)).catch(() => {});
  }, []);

  async function refreshActivity(): Promise<RefreshOutcome> {
    if (wakatimeConnectionAvailable && await authClient.getCookie()) {
      const [activity, leaders] = await Promise.all([syncWakaTime(), refreshLeaderboards()]);
      return activity === "success" && !leaders ? "partial" : activity;
    }
    await refresh();
    return "local";
  }

  function onPullRefresh() {
    setPullRefreshing(true);
    void runManualRefresh(refreshActivity, true).finally(() => setPullRefreshing(false));
  }

  return (
    <AndroidPageFrame title="Today" offset={offset}>
    <Animated.ScrollView
      contentInsetAdjustmentBehavior="automatic"
      onScroll={android ? onScroll : undefined}
      scrollEventThrottle={16}
      refreshControl={<RefreshControl refreshing={syncing || pullRefreshing} onRefresh={onPullRefresh} tintColor={palette.accent} colors={android ? ["transparent"] : undefined} progressBackgroundColor={android ? "transparent" : undefined} progressViewOffset={android ? -100 : undefined} />}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 38 }}
    >
      <AndroidLargeTitle title="Today" offset={offset} />
      <HomeHeader today={today} name={name} profile={currentProfile} syncing={syncing} sample={sample} hasActivity={summaries.length > 0} palette={palette} />
      {syncError ? <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 13 }}>{syncError}</Text> : null}
      {loading ? <LoadingIndicator color={palette.accent} style={{ paddingVertical: 65 }} /> : error ? <SurfaceCard palette={palette}><Text style={{ color: palette.text, fontWeight: "800" }}>Local data unavailable</Text><Text style={{ color: palette.muted }}>{error}</Text><OnboardingButton label="Try again" onPress={() => void refresh()} /></SurfaceCard> : summaries.length === 0 ? <SurfaceCard palette={palette}><SectionTitle title="Make your coding visible" palette={palette} /><Text style={{ color: palette.muted, fontSize: 14, lineHeight: 20 }}>Your WakaTime activity will appear after your first sync. You can explore with sample data meanwhile.</Text><OnboardingButton label="Explore sample data" onPress={() => void addSample()} /></SurfaceCard> : <>
        {sample ? <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>SAMPLE ACTIVITY</Text> : null}
        <HeroCard total={total} goalSeconds={goalSeconds} progress={progress} streak={streak} dailyAverage={dailyAverage} palette={palette} />
        {!android ? <GoalBooster remaining={remaining} palette={palette} /> : null}
      </>}
      <StandingCard palette={palette} />
      {summaries.length > 0 ? <>
        <WeeklyCard days={days} total={weekTotal} palette={palette} />
        {android ? <>
          <BreakdownCard title="Languages" rows={summary?.languages ?? []} palette={palette} />
          <EditorsCard rows={summary?.editors ?? []} palette={palette} />
          <BreakdownCard title="Projects Today" rows={summary?.projects ?? []} palette={palette} />
        </> : <>
          <BreakdownCard title="Projects Today" kicker="Breakdown" rows={summary?.projects ?? []} palette={palette} />
          <BreakdownCard title="Languages" rows={summary?.languages ?? []} palette={palette} />
          <EditorsCard rows={summary?.editors ?? []} palette={palette} />
        </>}
        <WeeklyInsight days={days} palette={palette} />
        <ChevronLink href="/activity" label="View activity timeline" color={palette.primary} fontSize={14} style={{ alignSelf: "center", paddingVertical: 10 }} />
      </> : null}
    </Animated.ScrollView>
    <RefreshIndicator visible={pullRefreshing} color={palette.accent} />
    </AndroidPageFrame>
  );
}
