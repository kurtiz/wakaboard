import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, PixelRatio, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { useDashboard } from "../../data/dashboard-context";
import { useLeaderboards } from "../../data/leaderboard-context";
import { resolvedLeaderboardRank, type LeaderboardScope } from "../../data/leaderboards";
import { getConnectedUser } from "../../data/wakatime-client";
import { usePalette } from "../../theme";
import { ScaleButton } from "../ui/scale-button";
import { buildAnalytics, type AnalyticsRange } from "../insights/analytics-data";
import { ShareCardSwitch } from "./share-card-switch";
import { StatShareArt, type ShareContent, type ShareStyle } from "./stat-share-art";

const styles: { id: ShareStyle; label: string; color: string }[] = [
  { id: "editorial", label: "Editorial", color: "#FAF9F3" },
  { id: "night", label: "Night", color: "#122B24" },
  { id: "rhythm", label: "Rhythm", color: "#FEA619" },
];

type Kind = "daily" | "analytics" | "leaderboard";
export function StatShareScreen({ kind }: { kind: Kind }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ date?: string; range?: string; scope?: string }>();
  const { summaries, loading: dashboardLoading, syncing, syncWakaTime } = useDashboard();
  const { boards, currentProfile, loading: boardLoading, refresh } = useLeaderboards();
  const cardRef = useRef<View>(null);
  const requestedLeaderboardStats = useRef(false);
  const [styleName, setStyleName] = useState<ShareStyle>("editorial");
  const [showName, setShowName] = useState(true);
  const [showProject, setShowProject] = useState(false);
  const [mode, setMode] = useState<"podium" | "personal">("podium");
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [today] = useState(() => new Date());
  const scope: LeaderboardScope = params.scope === "country" ? "country" : "global";
  const range: AnalyticsRange = params.range === "7" || params.range === "30" || params.range === "90" || params.range === "365" ? Number(params.range) as AnalyticsRange : params.range === "all" ? "all" : 30;
  const rawBoard = boards[scope];
  const rank = resolvedLeaderboardRank(rawBoard, currentProfile?.id ?? null);
  const board = rawBoard && rank !== rawBoard.rank ? { ...rawBoard, rank } : rawBoard;
  const listedSelf = board?.leaders.find((leader) => leader.rank === board.rank && leader.id === currentProfile?.id);
  const boardWithStats = board && !board.currentUser && listedSelf ? { ...board, currentUser: { seconds: listedSelf.seconds, dailyAverage: listedSelf.dailyAverage, languages: listedSelf.languages } } : board;
  const realSummaries = useMemo(() => summaries.filter((day) => day.source === "wakatime"), [summaries]);
  const analytics = useMemo(() => buildAnalytics(realSummaries, range, today), [realSummaries, range, today]);
  const day = realSummaries.find((item) => item.date === params.date);
  const currentRank = board?.rank;
  const canPodium = typeof currentRank === "number" && currentRank >= 1 && currentRank <= 3 && !!board?.leaders.find((leader) => leader.rank === currentRank);
  const selectedMode = canPodium ? mode : currentRank ? "personal" : "podium";
  const content: ShareContent | null = kind === "daily" ? day ? { kind, summary: day, showProject } : null
    : kind === "analytics" ? analytics.current.length ? { kind, summaries: realSummaries, range, today, showProject } : null
      : boardWithStats && (scope === "global" || boardWithStats.countryCode) && (currentRank || boardWithStats.leaders.length > 0) ? { kind, board: boardWithStats, scope, mode: selectedMode } : null;
  const title = kind === "daily" ? "Your coding day" : kind === "analytics" ? "Your coding report" : "Your leaderboard card";
  const name = currentProfile?.name ?? sessionName;
  const cardWidth = Math.min(screenWidth - 32, 420);
  const loading = kind === "leaderboard" ? boardLoading : dashboardLoading;

  useEffect(() => { void getConnectedUser().then((user) => setSessionName(user?.name ?? null)).catch(() => {}); }, []);
  useEffect(() => {
    if (kind !== "leaderboard" || !board?.rank || boardWithStats?.currentUser || requestedLeaderboardStats.current) return;
    requestedLeaderboardStats.current = true;
    void refresh();
  }, [kind, board?.rank, boardWithStats?.currentUser, refresh]);

  async function shareCard() {
    if (!content || !cardRef.current || sharing) return;
    setSharing(true);
    try {
      if (process.env.EXPO_OS === "web" || !await Sharing.isAvailableAsync()) {
        Alert.alert("Sharing unavailable", "Image sharing is available in the iOS and Android app.");
        return;
      }
      const captureScale = process.env.EXPO_OS === "android" ? 1 : PixelRatio.get();
      const uri = await captureRef(cardRef, { format: "png", result: "tmpfile", width: Math.round(1080 / captureScale), height: Math.round(1350 / captureScale) });
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: `Share ${title.toLowerCase()}` });
    } catch {
      Alert.alert("Could not share image", "Please try generating your card again.");
    } finally { setSharing(false); }
  }

  return <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: process.env.EXPO_OS === "android" ? insets.top + 18 : 18, paddingBottom: Math.max(30, insets.bottom + 20), gap: 18 }}>
    {process.env.EXPO_OS === "android" ? <ScaleButton label="Go back" onPress={() => router.back()} style={{ alignSelf: "flex-start", width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: palette.card }}><ArrowLeftIcon size={22} color={palette.text} /></ScaleButton> : null}
    <View style={{ gap: 5 }}><Text accessibilityRole="header" style={{ fontFamily: "Outfit", fontSize: 28, fontWeight: "800", color: palette.text }}>{title}</Text><Text style={{ fontFamily: "Nunito", fontSize: 14, color: palette.muted }}>Choose a look, then share a 4:5 PNG.</Text></View>
    {kind === "leaderboard" && canPodium ? <View style={{ flexDirection: "row", gap: 8 }}>
      {([ ["podium", "Top three"], ["personal", "Only me"] ] as const).map(([id, label]) => <ScaleButton key={id} label={`${label} leaderboard card`} selected={selectedMode === id} onPress={() => setMode(id)} wrapperStyle={{ flex: 1 }} style={{ alignItems: "center", padding: 13, borderRadius: 14, backgroundColor: selectedMode === id ? palette.primary : palette.card }}><Text style={{ fontFamily: "Outfit", fontWeight: "800", color: selectedMode === id ? palette.onPrimary : palette.text }}>{label}</Text></ScaleButton>)}
    </View> : null}
    {loading && !content ? <Text style={{ fontFamily: "Nunito", color: palette.muted }}>Loading saved data…</Text> : !content ? <View style={{ backgroundColor: palette.card, borderRadius: 22, padding: 20, gap: 12 }}>
      <Text style={{ fontFamily: "Outfit", color: palette.text, fontWeight: "800", fontSize: 18 }}>{kind === "leaderboard" ? board && scope === "country" && !board.countryCode ? "Country not set" : "No leaderboard data to share" : "No WakaTime activity to share yet"}</Text>
      <Text style={{ fontFamily: "Nunito", color: palette.muted, fontSize: 14, lineHeight: 21 }}>{kind === "leaderboard" ? board && scope === "country" && !board.countryCode ? "Set your country on your WakaTime profile, then refresh the leaderboard." : board ? "This leaderboard has no public entries or rank in the saved snapshot. Refresh to check the latest results." : "Load the leaderboard to create a share card." : "Sync your WakaTime activity to create a card from recorded coding time. Sample activity cannot be shared."}</Text>
      <ScaleButton label={kind === "leaderboard" ? "Refresh leaderboard" : "Sync WakaTime activity"} disabled={kind === "leaderboard" ? boardLoading : syncing} onPress={() => void (kind === "leaderboard" ? refresh() : syncWakaTime())} style={{ alignSelf: "flex-start", paddingHorizontal: 18, paddingVertical: 12, minHeight: 48, borderRadius: 999, backgroundColor: palette.primary }}><Text style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: "800", color: palette.onPrimary }}>{kind === "leaderboard" ? "Refresh ranking" : "Sync WakaTime"}</Text></ScaleButton>
    </View> : <>
      {kind === "leaderboard" && selectedMode === "personal" && !boardWithStats?.currentUser ? <View style={{ backgroundColor: palette.card, borderRadius: 16, padding: 14, gap: 9 }}><Text style={{ fontFamily: "Nunito", color: palette.muted, fontSize: 12 }}>Your rank is ready. Refresh rankings to add your coding totals to this card.</Text><ScaleButton label="Refresh ranking totals" disabled={boardLoading} onPress={() => void refresh()} style={{ alignSelf: "flex-start", paddingVertical: 7 }}><Text style={{ fontFamily: "Outfit", fontWeight: "800", color: palette.primary }}>{boardLoading ? "Refreshing…" : "Refresh rankings"}</Text></ScaleButton></View> : null}
      <View ref={cardRef} collapsable={false} style={{ alignSelf: "center", width: cardWidth, height: cardWidth * 1.25 }}><StatShareArt content={content} styleName={styleName} width={cardWidth} name={name} showName={showName} /></View>
      <View style={{ gap: 10 }}><Text style={{ fontFamily: "Outfit", fontSize: 17, fontWeight: "800", color: palette.text }}>Pick a style</Text><View style={{ flexDirection: "row", gap: 8 }}>{styles.map((option) => <ScaleButton key={option.id} label={`${option.label} card style`} selected={styleName === option.id} onPress={() => setStyleName(option.id)} wrapperStyle={{ flex: 1 }} style={{ minHeight: 68, borderRadius: 17, borderWidth: styleName === option.id ? 2 : 1, borderColor: styleName === option.id ? palette.primary : palette.border, backgroundColor: palette.card, padding: 10, gap: 4 }}><View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: option.color }} /><Text style={{ fontFamily: "Outfit", fontSize: 12, fontWeight: "800", color: palette.text }}>{option.label}</Text></ScaleButton>)}</View></View>
      <View style={{ backgroundColor: palette.card, borderRadius: 20, paddingHorizontal: 16 }}>
        {name ? <View style={{ minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Text style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: "700", color: palette.text }}>Show my name</Text><ShareCardSwitch value={showName} onValueChange={setShowName} label="Show my name on card" /></View> : null}
        {kind !== "leaderboard" ? <View style={{ minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><View><Text style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: "700", color: palette.text }}>Show top project</Text><Text style={{ fontFamily: "Nunito", fontSize: 11, color: palette.muted }}>Hidden by default for privacy</Text></View><ShareCardSwitch value={showProject} onValueChange={setShowProject} label="Show top project on card" /></View> : null}
      </View>
      <Text style={{ fontFamily: "Nunito", fontSize: 12, color: palette.muted, lineHeight: 18 }}>Based on saved WakaTime data shown on the card. The share sheet lets you post or save the PNG.</Text>
      <ScaleButton label="Generate and share PNG" disabled={sharing} onPress={() => void shareCard()} style={{ minHeight: 54, borderRadius: 18, backgroundColor: palette.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }}><ShareNetworkIcon size={20} color={palette.onPrimary} weight="bold" /><Text style={{ fontFamily: "Outfit", color: palette.onPrimary, fontWeight: "800", fontSize: 16 }}>{sharing ? "Preparing image…" : "Share PNG"}</Text></ScaleButton>
    </>}
  </ScrollView>;
}
