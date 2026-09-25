import { NativeTabs } from "expo-router/unstable-native-tabs";
import { View } from "react-native";
import { useLeaderboards } from "../../data/leaderboard-context";
import { useLeaderboardScope } from "./leaderboard-scope";
import { StandingCard } from "./standing-card";

export function StandingAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const { boards } = useLeaderboards();
  const { scope } = useLeaderboardScope();
  const board = boards[scope];
  const countryCode = boards.country?.countryCode ?? boards.global?.countryCode ?? null;
  if (!board || (scope === "country" && !countryCode)) return null;
  return <View style={{ paddingHorizontal: placement === "inline" ? 4 : 16, paddingVertical: placement === "inline" ? 0 : 5 }}>
    <StandingCard board={board} scope={scope} countryCode={countryCode} compact={placement === "inline"} />
  </View>;
}
