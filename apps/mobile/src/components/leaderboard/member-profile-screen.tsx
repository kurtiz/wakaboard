import { formatDuration, localDateKey } from "@wakaboard/core";
import { useLocalSearchParams } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useDashboard } from "../../data/dashboard-context";
import { loadCachedMemberProfile, saveCachedMemberProfile } from "../../data/dashboard-store";
import { useLeaderboards } from "../../data/leaderboard-context";
import { fetchMemberProfile, type Leader, type MemberProfile } from "../../data/leaderboards";
import { authClient } from "../../data/wakatime-client";
import { usePalette } from "../../theme";
import { MemberAvatar } from "./member-avatar";

function flag(code: string | null | undefined): string {
  if (!code || !/^[A-Z]{2}$/.test(code.toUpperCase())) return "";
  return String.fromCodePoint(...[...code.toUpperCase()].map((letter) => letter.charCodeAt(0) + 127397));
}

export function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isCurrent = id === "current";
  const palette = usePalette();
  const { boards, currentProfile } = useLeaderboards();
  const { summaries } = useDashboard();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today] = useState(() => new Date());
  const cutoffKey = useMemo(() => { const date = new Date(today); date.setDate(date.getDate() - 6); return localDateKey(date); }, [today]);
  const leader = useMemo<Leader | undefined>(() => [...(boards.global?.leaders ?? []), ...(boards.country?.leaders ?? [])].find((entry) => entry.id === id), [boards, id]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const session = await authClient.getSession().catch(() => null);
      const userId = session?.data?.user?.id ?? await SecureStore.getItemAsync("leaderboard_user_id").catch(() => null);
      if (isCurrent && session?.data?.user && active) {
        setProfile({ id: session.data.user.id, name: session.data.user.name, username: null, photo: session.data.user.image ?? null, bio: null, website: null, countryCode: boards.global?.countryCode ?? null, location: null });
      }
      if (userId) {
        const cached = await loadCachedMemberProfile(userId, id).catch(() => null);
        if (active && cached) setProfile(cached);
      }
      try {
        const fresh = await fetchMemberProfile(id);
        if (!active) return;
        setProfile(fresh);
        if (userId) await saveCachedMemberProfile(userId, id, fresh).catch(() => {});
      } catch {
        if (active) setError("Showing saved WakaTime details while the profile is unavailable.");
      } finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id, isCurrent, boards.global?.countryCode]);

  const ownLanguages = useMemo(() => {
    const totals = new Map<string, number>();
    for (const day of summaries) {
      if (day.date < cutoffKey) continue;
      for (const language of day.languages) totals.set(language.name, (totals.get(language.name) ?? 0) + language.seconds);
    }
    return [...totals].map(([name, seconds]) => ({ name, seconds })).sort((a, b) => b.seconds - a.seconds);
  }, [summaries, cutoffKey]);
  const languages = leader?.languages?.length ? leader.languages : isCurrent ? ownLanguages : [];
  const name = profile?.name ?? (isCurrent ? currentProfile?.name : leader?.name) ?? (isCurrent ? "Your profile" : "WakaTime member");
  const photo = profile?.photo ?? (isCurrent ? currentProfile?.photo : leader?.photo);
  const countryCode = profile?.countryCode ?? leader?.countryCode;
  const rank = leader?.rank ?? (isCurrent ? boards.global?.rank : null);
  const totalSeconds = leader?.seconds ?? (isCurrent ? summaries.filter((day) => day.date >= cutoffKey).reduce((sum, day) => sum + day.totalSeconds, 0) : null);
  const maxLanguageSeconds = Math.max(1, ...languages.map((language) => language.seconds));

  return <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 18 }}>
    <View style={{ alignItems: "center", gap: 9, padding: 23, borderRadius: 24, backgroundColor: palette.homeHero }}>
      <MemberAvatar id={profile?.id ?? id} name={name} photo={photo} size={78} dark />
      <Text selectable accessibilityRole="header" style={{ color: palette.homeHeroText, fontSize: 23, fontWeight: "800", textAlign: "center" }}>{name}</Text>
      {profile?.username ? <Text selectable style={{ color: palette.homeHeroMuted, fontSize: 13 }}>@{profile.username}</Text> : null}
      {countryCode || profile?.location ? <Text style={{ color: palette.homeHeroMuted, fontSize: 12 }}>{flag(countryCode)} {profile?.location ?? countryCode}</Text> : null}
      {profile?.bio ? <Text selectable style={{ color: palette.homeHeroText, fontSize: 13, textAlign: "center", lineHeight: 19 }}>{profile.bio}</Text> : null}
      {profile?.website ? <Text selectable style={{ color: palette.homeHeroMuted, fontSize: 11 }}>{profile.website}</Text> : null}
    </View>
    {loading && !profile && !leader ? <ActivityIndicator color={palette.primary} /> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: palette.muted, fontSize: 12 }}>{error}</Text> : null}
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ flex: 1, padding: 17, borderRadius: 19, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, gap: 5 }}>
        <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>GLOBAL RANK</Text>
        <Text selectable style={{ color: palette.primary, fontSize: 27, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{rank == null ? "—" : `#${rank}`}</Text>
      </View>
      <View style={{ flex: 1, padding: 17, borderRadius: 19, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, gap: 5 }}>
        <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "700" }}>LAST 7 DAYS</Text>
        <Text selectable numberOfLines={1} adjustsFontSizeToFit style={{ color: palette.primary, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{totalSeconds == null ? "—" : formatDuration(totalSeconds)}</Text>
      </View>
    </View>
    {isCurrent && boards.country?.rank != null ? <View style={{ padding: 16, borderRadius: 18, backgroundColor: palette.homeSurface }}><Text style={{ color: palette.text, fontWeight: "700" }}>{flag(boards.country.countryCode)} Country rank #{boards.country.rank}</Text></View> : null}
    <View style={{ gap: 12, padding: 18, borderRadius: 21, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border }}>
      <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 16, fontWeight: "800" }}>Languages used</Text>
      {languages.length ? languages.slice(0, 8).map((language) => <View key={language.name} style={{ gap: 5 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}><Text numberOfLines={1} style={{ flex: 1, color: palette.text, fontSize: 12, fontWeight: "700" }}>{language.name}</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{formatDuration(language.seconds)}</Text></View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: palette.track, overflow: "hidden" }}><View style={{ width: `${Math.max(2, language.seconds / maxLanguageSeconds * 100)}%`, height: 6, borderRadius: 3, backgroundColor: palette.primary }} /></View>
      </View>) : <Text style={{ color: palette.muted, fontSize: 12 }}>No public language data is available for this profile.</Text>}
    </View>
  </ScrollView>;
}
