import { View } from "react-native";
import type { Leaderboard, LeaderboardScope } from "../../data/leaderboards";
import { StandingCard } from "./standing-card";

export function StandingOverlay({ board, scope, countryCode }: { board: Leaderboard | null; scope: LeaderboardScope; countryCode: string | null }) {
  if (!board || (scope === "country" && !countryCode)) return null;
  return <View style={{ position: "absolute", left: 16, right: 16, bottom: 10 }}>
    <StandingCard board={board} scope={scope} countryCode={countryCode} />
  </View>;
}
