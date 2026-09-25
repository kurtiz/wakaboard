import type { Leaderboard, LeaderboardScope } from "../../data/leaderboards";
import { AnimatedStandingOverlay } from "./animated-standing-overlay";

export function StandingOverlay({ board, scope, countryCode }: { board: Leaderboard | null; scope: LeaderboardScope; countryCode: string | null }) {
  return <AnimatedStandingOverlay board={board} scope={scope} countryCode={countryCode} bottom={10} horizontalInset={16} />;
}
