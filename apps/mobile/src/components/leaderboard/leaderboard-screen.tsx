import { Text } from "../ui/app-text";
import { formatDuration } from "@wakaboard/core";
import { router } from "expo-router";
import { useState } from "react";
import { GlobeIcon } from "phosphor-react-native/src/icons/Globe";
import { LockKeyIcon } from "phosphor-react-native/src/icons/LockKey";
import { MedalIcon } from "phosphor-react-native/src/icons/Medal";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { Pressable, RefreshControl, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLeaderboards } from "../../data/leaderboard-context";
import { resolvedLeaderboardRank, type Leader, type LeaderboardScope } from "../../data/leaderboards";
import { usePalette } from "../../theme";
import { runManualRefresh } from "../../haptic-actions";
import { ScaleButton } from "../ui/scale-button";
import { LoadingIndicator } from "../ui/loading-indicator";
import { RefreshIndicator } from "../ui/refresh-indicator";
import { usePullRefreshFeedback } from "../ui/use-pull-refresh-feedback";
import { SegmentedPicker } from "../ui/segmented-picker";
import { useLeaderboardScope } from "./leaderboard-scope";
import { MemberAvatar } from "./member-avatar";
import { StandingOverlay } from "./standing-overlay";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../navigation/android-page-header";

type Palette = ReturnType<typeof usePalette>;

function countryName(code: string | null): string {
  if (!code) return "Your country";
  const known: Record<string, string> = { GH: "Ghana", US: "United States", GB: "United Kingdom" };
  if (known[code]) return known[code];
  try { return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code; }
  catch { return code; }
}

function countryFlag(code: string | null): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((letter) => letter.charCodeAt(0) + 127397));
}

function memberHref(id: string) {
  return { pathname: "/profile/[id]" as const, params: { id } };
}

function languagesLabel(leader: Leader): string {
  return (leader.languages ?? []).map((language) => language.name).join(", ");
}

function ScopeSelector({ scope, countryCode, onChange, palette }: {
  scope: LeaderboardScope; countryCode: string | null; onChange: (scope: LeaderboardScope) => void; palette: Palette;
}) {
  return <SegmentedPicker
    options={[
      { value: "global", label: "Global", accessibilityLabel: "Global leaderboard" },
      { value: "country", label: countryName(countryCode), accessibilityLabel: `${countryName(countryCode)} leaderboard` },
    ] as const}
    value={scope}
    onChange={onChange}
    renderLeading={(option, selected) => option === "global"
      ? <GlobeIcon size={16} color={selected ? palette.primary : palette.muted} />
      : countryCode ? <Text style={{ fontSize: 15 }}>{countryFlag(countryCode)}</Text> : null}
  />;
}

function PodiumPerson({ leader, first, scope, palette }: { leader: Leader; first?: boolean; scope: LeaderboardScope; palette: Palette }) {
  const dark = !!first;
  const textColor = dark ? palette.homeHeroText : palette.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${leader.name}'s WakaTime profile`} onPress={() => router.push(memberHref(leader.id))} style={{ flex: 1, minWidth: 0, alignItems: "center", paddingHorizontal: 7, paddingTop: first ? 24 : 19, paddingBottom: first ? 17 : 13, borderRadius: 19, borderWidth: 1, borderColor: dark ? palette.homeHero : palette.border, backgroundColor: dark ? palette.homeHero : palette.card, transform: [{ translateY: first ? -7 : 0 }] }}>
    <View style={{ position: "absolute", top: -10, flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: first ? palette.homeAmber : palette.track }}>
      {first ? <MedalIcon size={13} weight="fill" color={palette.homeAmberText} /> : null}
      <Text style={{ color: first ? palette.homeAmberText : palette.muted, fontSize: 10, fontWeight: "800" }}>#{leader.rank}</Text>
    </View>
    <MemberAvatar id={leader.id} name={leader.name} photo={leader.photo} size={first ? 43 : 37} dark={dark} />
    <Text numberOfLines={1} style={{ width: "100%", marginTop: 9, color: textColor, textAlign: "center", fontSize: 12, fontWeight: "800" }}>{leader.name}</Text>
    <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: textColor, marginTop: 3, fontSize: first ? 16 : 14, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(leader.seconds)}</Text>
    {scope === "global" && leader.countryCode ? <Text numberOfLines={1} style={{ marginTop: 6, color: dark ? palette.homeHeroMuted : palette.muted, fontSize: 10 }}>{countryFlag(leader.countryCode)} {countryName(leader.countryCode)}</Text> : null}
  </Pressable>;
}

function Podium({ leaders, scope, palette }: { leaders: Leader[]; scope: LeaderboardScope; palette: Palette }) {
  const order = [leaders[1], leaders[0], leaders[2]].filter((leader): leader is Leader => !!leader);
  if (!order.length) return null;
  return <View style={{ paddingTop: 20, paddingHorizontal: 11, paddingBottom: 8, borderRadius: 24, backgroundColor: palette.homeSurface }}>
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 7 }}>
      {order.map((leader) => <PodiumPerson key={leader.id} leader={leader} first={leader.rank === 1} scope={scope} palette={palette} />)}
    </View>
  </View>;
}

function RankingRow({ leader, scope, currentRank, palette }: { leader: Leader; scope: LeaderboardScope; currentRank: number | null; palette: Palette }) {
  const current = leader.rank === currentRank;
  return <Pressable accessibilityRole="button" accessibilityLabel={`View ${leader.name}'s WakaTime profile`} onPress={() => router.push(memberHref(leader.id))} style={{ minHeight: 69, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: current ? palette.userBadge : palette.card }}>
    <Text style={{ width: 25, color: current ? palette.primary : palette.muted, fontSize: 12, fontWeight: "800" }}>#{leader.rank}</Text>
    <MemberAvatar id={leader.id} name={leader.name} photo={leader.photo} size={33} />
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <Text numberOfLines={1} style={{ color: palette.text, fontSize: 13, fontWeight: "700" }}>{current ? `You · ${leader.name}` : leader.name}</Text>
      <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: palette.muted, fontSize: 10 }}>
        {scope === "global" && leader.countryCode ? `${countryFlag(leader.countryCode)} ${countryName(leader.countryCode)}` : ""}{scope === "global" && leader.countryCode && languagesLabel(leader) ? " · " : ""}{languagesLabel(leader)}
      </Text>
    </View>
    <Text style={{ color: palette.primary, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(leader.seconds)}</Text>
  </Pressable>;
}

export function LeaderboardScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { offset, onScroll } = useAndroidPageScroll();
  const { boards, currentProfile, loading, error, refresh } = useLeaderboards();
  const pull = usePullRefreshFeedback(offset, loading || pullRefreshing);
  const { scope, setScope } = useLeaderboardScope();
  const rawBoard = boards[scope];
  const rank = resolvedLeaderboardRank(rawBoard, currentProfile?.id ?? null);
  const board = rawBoard && rank !== rawBoard.rank ? { ...rawBoard, rank } : rawBoard;
  const countryCode = boards.country?.countryCode ?? boards.global?.countryCode ?? null;
  const leaders = scope === "country" && !countryCode ? [] : (board?.leaders ?? []).slice(0, 10);
  const updated = board?.updatedAt ? new Date(board.updatedAt) : null;
  const updatedLabel = updated && !Number.isNaN(updated.getTime()) ? `Updated ${updated.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "WakaTime rankings";

  function onPullRefresh() {
    setPullRefreshing(true);
    void runManualRefresh(async () => await refresh() ? "success" : "error", true).finally(() => setPullRefreshing(false));
  }

  return <AndroidPageFrame title="Leaderboards" offset={offset}>
    <Animated.ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={process.env.EXPO_OS === "android" ? onScroll : undefined} onScrollBeginDrag={pull.onScrollBeginDrag} onTouchStart={pull.onTouchStart} onTouchMove={pull.onTouchMove} onTouchEnd={pull.onTouchEnd} onTouchCancel={pull.onTouchCancel} scrollEventThrottle={16} refreshControl={<RefreshControl refreshing={process.env.EXPO_OS === "android" ? loading || pullRefreshing : pullRefreshing} onRefresh={onPullRefresh} tintColor={palette.primary} colors={process.env.EXPO_OS === "android" ? [pullRefreshing ? "transparent" : palette.primary] : undefined} progressBackgroundColor={process.env.EXPO_OS === "android" ? pullRefreshing ? "transparent" : palette.card : undefined} progressViewOffset={process.env.EXPO_OS === "android" ? pullRefreshing ? -100 : insets.top + 8 : undefined} />} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 17, paddingBottom: board ? 220 : 30, gap: 18 }}>
      <AndroidLargeTitle title="Leaderboards" offset={offset} />
      <ScopeSelector scope={scope} countryCode={countryCode} onChange={setScope} palette={palette} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <View style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: palette.homeSurface }}><Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>Last 7 days</Text></View>
        <Text style={{ color: palette.muted, fontSize: 11 }}>All languages</Text>
      </View>
      {loading && !board ? <LoadingIndicator color={palette.primary} style={{ paddingVertical: 36 }} /> : null}
      {error && !board ? <View style={{ gap: 12, padding: 18, borderRadius: 22, backgroundColor: palette.homeSurface }}>
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 18, fontWeight: "800" }}>Rankings unavailable</Text>
        <Text accessibilityRole="alert" style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>{error}</Text>
        <ScaleButton label="Try loading rankings again" onPress={() => void runManualRefresh(async () => await refresh() ? "success" : "error")} glass="regular" style={{ alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: palette.homeHero }}><Text style={{ color: palette.homeHeroText, fontWeight: "700" }}>Try again</Text></ScaleButton>
        <ScaleButton label="Check WakaTime connection" onPress={() => router.push("/(tabs)/(settings)")} style={{ alignSelf: "flex-start", paddingVertical: 4 }}><Text style={{ color: palette.primary, fontSize: 12, fontWeight: "700" }}>Check WakaTime connection</Text></ScaleButton>
      </View> : null}
      {error && board ? <Text accessibilityRole="alert" style={{ color: palette.muted, fontSize: 11 }}>Showing saved rankings. {error}</Text> : null}
      {scope === "country" && board && !countryCode ? <View style={{ padding: 18, borderRadius: 22, backgroundColor: palette.homeSurface, gap: 5 }}>
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: "800" }}>Set your country in WakaTime</Text>
        <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>Add a country to your public WakaTime profile to see local rankings.</Text>
      </View> : null}
      {leaders.length ? <Podium leaders={leaders} scope={scope} palette={palette} /> : null}
      {board && (scope === "global" || countryCode) ? <>
        {board.rank || leaders.length > 0 ? <ScaleButton label="Create leaderboard share image" onPress={() => router.push({ pathname: "/share/leaderboard", params: { scope } })} style={{ minHeight: 64, borderRadius: 19, backgroundColor: palette.homeHero, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ flex: 1, gap: 3 }}><Text style={{ color: palette.homeHeroText, fontSize: 15, fontWeight: "800" }}>{`Share ${scope === "country" ? "country" : "global"} standing`}</Text><Text style={{ color: palette.homeHeroMuted, fontSize: 11 }}>{board.rank && board.rank <= 3 ? "Choose top three or only you" : board.rank ? "Create a personal ranking card" : "Create a top three ranking card"}</Text></View><ShareNetworkIcon size={21} color={palette.homeHeroText} weight="duotone" /></ScaleButton> : null}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, paddingHorizontal: 3 }}>
          <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 12, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }}>Rankings</Text>
          <Text style={{ color: palette.muted, fontSize: 11 }}>{leaders.length ? `Top ${leaders.length} · ${updatedLabel}` : updatedLabel}</Text>
        </View>
        {leaders.length > 3 ? <View style={{ borderRadius: 21, overflow: "hidden", borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card }}>
          {leaders.slice(3).map((leader, index) => <View key={leader.id}>
            {index ? <View style={{ height: 1, marginHorizontal: 14, backgroundColor: palette.border }} /> : null}
            <RankingRow leader={leader} scope={scope} currentRank={board.rank} palette={palette} />
          </View>)}
        </View> : null}
        {!leaders.length ? <Text style={{ color: palette.muted }}>No public rankings are available yet.</Text> : null}
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 5 }}>
          <LockKeyIcon size={13} color={palette.muted} />
          <Text style={{ color: palette.muted, fontSize: 11 }}>Public leaderboard data from WakaTime</Text>
        </View>
      </> : null}
    </Animated.ScrollView>
    <RefreshIndicator pulling={pull.pulling} refreshing={pullRefreshing} progress={pull.progress} color={palette.primary} />
    <StandingOverlay board={board} scope={scope} countryCode={countryCode} />
  </AndroidPageFrame>;
}
