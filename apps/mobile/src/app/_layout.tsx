import "../global.css";

import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { pageHeaderOptions } from "../components/navigation/page-header-options";
import { DashboardProvider } from "../data/dashboard-context";
import { LeaderboardProvider } from "../data/leaderboard-context";
import { FontProvider, useFontChoice } from "../font-choice";
import { usePalette } from "../theme";

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito: require("../../assets/fonts/Nunito.ttf"),
    Outfit: require("../../assets/fonts/Outfit.ttf"),
  });
  const palette = usePalette();
  if (!fontsLoaded && !fontError) return null;
  return (
    <FontProvider>
      <DashboardProvider>
        <LeaderboardProvider>
          <StatusBar style={palette.scheme === "dark" ? "light" : "dark"} />
          <AppStack palette={palette} />
        </LeaderboardProvider>
      </DashboardProvider>
    </FontProvider>
  );
}

function AppStack({ palette }: { palette: ReturnType<typeof usePalette> }) {
  const { font } = useFontChoice();
  return <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: "minimal" }}>
    <Stack.Screen name="activity" options={{ ...pageHeaderOptions(palette, font), title: "Activity" }} />
    <Stack.Screen name="profile/[id]" options={{ ...pageHeaderOptions(palette, font), title: "Profile" }} />
  </Stack>;
}
