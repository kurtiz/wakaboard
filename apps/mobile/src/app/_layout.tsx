import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DashboardProvider } from "../data/dashboard-context";
import { LeaderboardProvider } from "../data/leaderboard-context";
import { usePalette } from "../theme";

export default function Layout() {
  const palette = usePalette();
  return (
    <DashboardProvider>
      <LeaderboardProvider>
        <StatusBar style={palette.scheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }} />
      </LeaderboardProvider>
    </DashboardProvider>
  );
}
