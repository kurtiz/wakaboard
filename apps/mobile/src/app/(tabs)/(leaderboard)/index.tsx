import { formatDuration } from "@wakaboard/core";
import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { DashboardCard } from "../../../components/dashboard-card";
import { NativeAction } from "../../../components/native-action";
import { useLeaderboards } from "../../../data/leaderboard-context";
import type { Leader, LeaderboardScope } from "../../../data/leaderboards";
import { usePalette } from "../../../theme";

function nameForCountry(code: string | null): string {
  if (!code) return "Your country";
  try { return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code; }
  catch { return code; }
}

export default function LeaderboardScreen() {
  const palette = usePalette();
  const { boards, loading, error, refresh } = useLeaderboards();
  const [scope, setScope] = useState<LeaderboardScope>("country");
  const board = boards[scope];
  const countryCode = boards.country?.countryCode ?? boards.global?.countryCode ?? null;
  const rows = board?.leaders ?? [];

  const header = (
    <View style={{ gap: 18, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 }}>
      <Text style={{ color: palette.muted, fontSize: 15, lineHeight: 22 }}>
        See where your coding time stands this week. WakaTime updates public ranks periodically.
      </Text>
      <View style={{ flexDirection: "row", gap: 8, padding: 5, borderRadius: 999, backgroundColor: palette.track }}>
        {(["country", "global"] as const).map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: scope === option }}
            accessibilityLabel={option === "country" ? "Country leaderboard" : "Global leaderboard"}
            onPress={() => setScope(option)}
            style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: scope === option ? palette.card : "transparent" }}
          >
            <Text style={{ color: scope === option ? palette.text : palette.muted, fontSize: 14, fontWeight: "700" }}>
              {option === "country" ? nameForCountry(countryCode) : "Global"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !board ? <ActivityIndicator color={palette.accent} style={{ paddingVertical: 42 }} /> : null}
      {error && !board ? (
        <DashboardCard title="Rankings unavailable">
          <Text style={{ color: palette.muted, lineHeight: 22 }}>{error}</Text>
          <Link href="/(tabs)/(settings)" style={{ color: palette.accent, fontWeight: "700" }}>Check WakaTime connection</Link>
          <NativeAction label="Try again" onPress={() => void refresh()} />
        </DashboardCard>
      ) : null}
      {error && board ? <Text accessibilityRole="alert" style={{ color: palette.muted, fontSize: 12 }}>Showing saved rankings. {error}</Text> : null}
      {scope === "country" && board && !countryCode ? (
        <DashboardCard title="Set your country in WakaTime">
          <Text style={{ color: palette.muted, lineHeight: 22 }}>Add a country to your WakaTime profile to see your local leaderboard.</Text>
        </DashboardCard>
      ) : null}
      {board && (scope === "global" || countryCode) ? (
        <>
          <View style={{ backgroundColor: palette.hero, borderRadius: 28, padding: 24, gap: 8 }}>
            <Text style={{ color: palette.heroKicker, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>YOUR STANDING · {scope === "global" ? "GLOBAL" : nameForCountry(countryCode).toUpperCase()}</Text>
            <Text selectable style={{ color: palette.onPrimary, fontSize: 44, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
              {board.rank === null ? "Unranked" : `#${board.rank}`}
            </Text>
            <Text style={{ color: palette.heroMuted, fontSize: 13, lineHeight: 19 }}>
              {board.rank === null ? "Your public profile may be private or ineligible for this board." : `Based on WakaTime's ${board.range.toLowerCase()} leaderboard`}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 21, fontWeight: "700" }}>Top developers</Text>
            <Text style={{ color: palette.muted, fontSize: 12 }}>{board.updatedAt ? `Updated ${new Date(board.updatedAt).toLocaleDateString()}` : board.range}</Text>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 36 }}
      data={scope === "country" && !countryCode ? [] : rows}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      ListEmptyComponent={board && countryCode ? <Text style={{ color: palette.muted, marginHorizontal: 20 }}>No public rankings are available yet.</Text> : null}
      renderItem={({ item }: { item: Leader }) => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 20, marginBottom: 8, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card }}>
          <Text style={{ color: item.rank <= 3 ? palette.accent : palette.muted, fontSize: 17, fontWeight: "800", width: 44 }}>#{item.rank}</Text>
          <View style={{ flex: 1, gap: 3 }}>
            <Text numberOfLines={1} style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>{item.name}</Text>
            {scope === "global" && item.countryCode ? <Text style={{ color: palette.muted, fontSize: 12 }}>{nameForCountry(item.countryCode)}</Text> : null}
          </View>
          <Text style={{ color: palette.text, fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{formatDuration(item.seconds)}</Text>
        </View>
      )}
      refreshing={loading}
      onRefresh={() => void refresh()}
    />
  );
}
