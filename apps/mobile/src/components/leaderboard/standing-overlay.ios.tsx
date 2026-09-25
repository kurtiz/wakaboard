import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Leaderboard, LeaderboardScope } from "../../data/leaderboards";
import { AnimatedStandingOverlay } from "./animated-standing-overlay";

export function StandingOverlay({ board, scope, countryCode }: {
  board: Leaderboard | null;
  scope: LeaderboardScope;
  countryCode: string | null
}) {
  const insets = useSafeAreaInsets();
  return <AnimatedStandingOverlay
    board={board} scope={scope} countryCode={countryCode}
    bottom={insets.bottom + 12} horizontalInset={18}/>;
}
