import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { ShareNetworkIcon } from "phosphor-react-native/src/icons/ShareNetwork";
import { ArrowLeftIcon } from "phosphor-react-native/src/icons/ArrowLeft";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, PixelRatio, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { useDashboard } from "../../data/dashboard-context";
import { useLeaderboards } from "../../data/leaderboard-context";
import { getConnectedUser } from "../../data/wakatime-client";
import { usePalette } from "../../theme";
import { ScaleButton } from "../ui/scale-button";
import { CodingWeekArt, type CodingWeekStyle } from "./coding-week-art";
import { buildCodingWeekReport } from "./coding-week-data";
import { ShareCardSwitch } from "./share-card-switch";

const styles: { id: CodingWeekStyle; label: string; description: string; color: string }[] = [
  { id: "editorial", label: "Editorial", description: "Warm and spacious", color: "#FAF9F3" },
  { id: "night", label: "Night", description: "Deep pine", color: "#122B24" },
  { id: "rhythm", label: "Rhythm", description: "Bright amber", color: "#FEA619" },
];

function Choice({ label, description, color, selected, onPress, palette }: {
  label: string; description: string; color: string; selected: boolean; onPress: () => void; palette: ReturnType<typeof usePalette>;
}) {
  return <ScaleButton label={`${label} card style`} selected={selected} onPress={onPress} wrapperStyle={{ flex: 1 }} style={{ minHeight: 86, borderRadius: 18, borderWidth: selected ? 2 : 1, borderColor: selected ? palette.primary : palette.border, backgroundColor: palette.card, padding: 10, gap: 5 }}>
    <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: color, borderWidth: color === "#FAF9F3" ? 1 : 0, borderColor: palette.border }} />
    <Text style={{ fontFamily: "Outfit", fontSize: 13, fontWeight: "800", color: palette.text }}>{label}</Text>
    <Text numberOfLines={1} style={{ fontFamily: "Nunito", fontSize: 10, color: palette.muted }}>{description}</Text>
  </ScaleButton>;
}

export function CodingWeekScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { summaries, loading, syncing, syncWakaTime } = useDashboard();
  const { currentProfile } = useLeaderboards();
  const cardRef = useRef<View>(null);
  const [styleName, setStyleName] = useState<CodingWeekStyle>("editorial");
  const [showName, setShowName] = useState(true);
  const [showProject, setShowProject] = useState(false);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [now] = useState(() => new Date());
  const report = useMemo(() => buildCodingWeekReport(summaries, now), [summaries, now]);
  const name = currentProfile?.name ?? sessionName;
  const cardWidth = Math.min(screenWidth - 32, 420);
  const sampleOnly = !report && summaries.some((day) => day.source === "sample");

  useEffect(() => {
    void getConnectedUser().then((user) => setSessionName(user?.name ?? null)).catch(() => {});
  }, []);

  async function shareCard() {
    if (!report || !cardRef.current || sharing) return;
    setSharing(true);
    try {
      if (process.env.EXPO_OS === "web" || !await Sharing.isAvailableAsync()) {
        Alert.alert("Sharing unavailable", "Image sharing is available in the iOS and Android app.");
        return;
      }
      const pixelRatio = PixelRatio.get();
      const captureScale = process.env.EXPO_OS === "android" ? 1 : pixelRatio;
      const uri = await captureRef(cardRef, {
        format: "png",
        result: "tmpfile",
        width: Math.round(1080 / captureScale),
        height: Math.round(1350 / captureScale),
      });
      await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Share your coding week" });
    } catch {
      Alert.alert("Could not share image", "Please try generating your card again.");
    } finally {
      setSharing(false);
    }
  }

  return <ScrollView style={{ flex: 1, backgroundColor: palette.background }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: process.env.EXPO_OS === "android" ? insets.top + 18 : 18, paddingBottom: Math.max(30, insets.bottom + 20), gap: 18 }}>
    {process.env.EXPO_OS === "android" ? <ScaleButton label="Back to analytics" onPress={() => router.back()} style={{ alignSelf: "flex-start", width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: palette.card }}><ArrowLeftIcon size={22} color={palette.text} /></ScaleButton> : null}
    <View style={{ gap: 5 }}>
      <Text accessibilityRole="header" style={{ fontFamily: "Outfit", fontSize: 28, fontWeight: "800", color: palette.text }}>Your coding week</Text>
      <Text style={{ fontFamily: "Nunito", fontSize: 14, color: palette.muted }}>Choose a look, then share your last seven days as a PNG.</Text>
    </View>
    {loading ? <Text style={{ fontFamily: "Nunito", color: palette.muted }}>Loading saved activity…</Text> : !report ? <View style={{ backgroundColor: palette.card, borderRadius: 22, padding: 20, gap: 12 }}>
      <Text style={{ fontFamily: "Outfit", color: palette.text, fontWeight: "800", fontSize: 18 }}>No real coding week yet</Text>
      <Text style={{ fontFamily: "Nunito", color: palette.muted, fontSize: 14, lineHeight: 21 }}>{sampleOnly ? "Sample activity is for exploring the app. Sync your WakaTime activity to make a shareable card." : "Sync WakaTime activity to make a card from your recent coding time."}</Text>
      <ScaleButton label="Sync WakaTime activity" disabled={syncing} onPress={() => void syncWakaTime()} style={{ alignSelf: "flex-start", paddingHorizontal: 18, paddingVertical: 12, minHeight: 48, borderRadius: 999, backgroundColor: palette.primary }}><Text style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: "800", color: palette.onPrimary }}>{syncing ? "Syncing…" : "Sync WakaTime"}</Text></ScaleButton>
      <ScaleButton label="Open connection settings" onPress={() => router.push("/(tabs)/(settings)")} style={{ alignSelf: "flex-start", paddingVertical: 8 }}><Text style={{ fontFamily: "Nunito", fontSize: 13, color: palette.primary }}>Check connection settings</Text></ScaleButton>
    </View> : <>
      <View ref={cardRef} collapsable={false} style={{ alignSelf: "center", width: cardWidth, height: cardWidth * 1.25 }}>
        <CodingWeekArt report={report} styleName={styleName} width={cardWidth} name={name} showName={showName} showProject={showProject} />
      </View>
      <View style={{ gap: 10 }}>
        <Text style={{ fontFamily: "Outfit", fontSize: 17, fontWeight: "800", color: palette.text }}>Pick a style</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>{styles.map((option) => <Choice key={option.id} {...option} selected={styleName === option.id} onPress={() => setStyleName(option.id)} palette={palette} />)}</View>
      </View>
      <View style={{ backgroundColor: palette.card, borderRadius: 20, paddingHorizontal: 16 }}>
        {name ? <View style={{ minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}><View style={{ flex: 1 }}><Text style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: "700", color: palette.text }}>Show my name</Text><Text numberOfLines={1} style={{ fontFamily: "Nunito", fontSize: 11, color: palette.muted }}>{name}</Text></View><ShareCardSwitch value={showName} onValueChange={setShowName} label="Show my name on card" /></View> : null}
        {name && report.topProject ? <View style={{ height: 1, backgroundColor: palette.border }} /> : null}
        {report.topProject ? <View style={{ minHeight: 57, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}><View style={{ flex: 1 }}><Text style={{ fontFamily: "Outfit", fontSize: 14, fontWeight: "700", color: palette.text }}>Show top project</Text><Text numberOfLines={1} style={{ fontFamily: "Nunito", fontSize: 11, color: palette.muted }}>Hidden by default for privacy</Text></View><ShareCardSwitch value={showProject} onValueChange={setShowProject} label="Show top project on card" /></View> : null}
      </View>
      <Text style={{ fontFamily: "Nunito", fontSize: 12, color: palette.muted, lineHeight: 18 }}>Based on saved WakaTime activity from the dates shown on the card. The share sheet lets you post or save the PNG.</Text>
      <ScaleButton label="Generate and share PNG" disabled={sharing} onPress={() => void shareCard()} style={{ minHeight: 54, borderRadius: 18, backgroundColor: palette.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }}><ShareNetworkIcon size={20} color={palette.onPrimary} weight="bold" /><Text style={{ fontFamily: "Outfit", color: palette.onPrimary, fontWeight: "800", fontSize: 16 }}>{sharing ? "Preparing image…" : "Share PNG"}</Text></ScaleButton>
    </>}
  </ScrollView>;
}
