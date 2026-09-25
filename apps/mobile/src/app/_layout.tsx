import "../global.css";

import { Stack } from "expo-router";
import { DashboardProvider } from "../data/dashboard-context";
import { LeaderboardProvider } from "../data/leaderboard-context";

export default function Layout() {
  return (
    <DashboardProvider>
      <LeaderboardProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LeaderboardProvider>
    </DashboardProvider>
  );
}
