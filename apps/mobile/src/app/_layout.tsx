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
        <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: "minimal" }}>
          <Stack.Screen name="activity" options={{ title: "Activity", headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: palette.background }, headerTintColor: palette.text, contentStyle: { backgroundColor: palette.background } }} />
          <Stack.Screen name="profile/[id]" options={{ title: "WakaTime profile", headerShown: true, headerShadowVisible: false, headerStyle: { backgroundColor: palette.background }, headerTintColor: palette.text, contentStyle: { backgroundColor: palette.background } }} />
        </Stack>
      </LeaderboardProvider>
    </DashboardProvider>
  );
}
