import { Text, View } from "react-native";
import type { Leaderboard, LeaderboardScope } from "../../data/leaderboards";
import { usePalette } from "../../theme";

function countryName(code: string | null): string {
  if (code === "GH") return "Ghana";
  if (!code) return "Your country";
  try { return new Intl.DisplayNames(undefined, { type: "region" }).of(code) ?? code; }
  catch { return code; }
}

export function StandingCard({ board, scope, countryCode, compact = false }: {
  board: Leaderboard;
  scope: LeaderboardScope;
  countryCode: string | null;
  compact?: boolean;
}) {
  const palette = usePalette();
  const location = scope === "global" ? "Global" : countryName(countryCode);
  return <View style={{
    borderRadius: compact ? 999 : 20,
    paddingHorizontal: compact ? 12 : 15,
    paddingVertical: compact ? 8 : 12,
    backgroundColor: palette.homeHero,
    flexDirection: "row",
    alignItems: "center",
    gap: compact ? 8 : 11,
    elevation: 5,
  }}>
    <View style={{ width: compact ? 28 : 34, height: compact ? 28 : 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: palette.homeHeroChip }}>
      <Text style={{ color: palette.homeHeroText, fontSize: compact ? 9 : 10, fontWeight: "800" }}>YOU</Text>
    </View>
    {!compact ? <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      <Text style={{ color: palette.homeHeroText, fontSize: 13, fontWeight: "800" }}>Your standing</Text>
      <Text style={{ color: palette.homeHeroMuted, fontSize: 11 }}>{location} · Last 7 days</Text>
    </View> : <Text style={{ color: palette.homeHeroText, fontSize: 11, fontWeight: "700" }}>{location}</Text>}
    <Text selectable style={{ color: palette.homeHeroText, fontSize: compact ? 17 : 23, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
      {board.rank === null ? "—" : `#${board.rank}`}
    </Text>
  </View>;
}
