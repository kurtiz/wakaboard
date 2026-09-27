import "../global.css";

import { HotUpdater } from "@hot-updater/react-native";
import { Stack, usePathname } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { initializeAppearance } from "../appearance-preferences";
import { pageHeaderOptions } from "../components/navigation/page-header-options";
import { HapticPreset } from "../constants/haptics";
import { DashboardProvider } from "../data/dashboard-context";
import { LeaderboardProvider } from "../data/leaderboard-context";
import { FontProvider, useFontChoice } from "../font-choice";
import { PaletteProvider, usePalette } from "../theme";

function Layout() {
  initializeAppearance();
  const [fontsLoaded, fontError] = useFonts({
    Nunito: require("../../assets/fonts/Nunito.ttf"),
    Outfit: require("../../assets/fonts/Outfit.ttf"),
  });
  if (!fontsLoaded && !fontError) return null;
  return <PaletteProvider><AppProviders /></PaletteProvider>;
}

const updateServerUrl = process.env.EXPO_PUBLIC_HOT_UPDATER_URL;

export default updateServerUrl
  ? HotUpdater.wrap({ baseURL: updateServerUrl, updateStrategy: "appVersion" })(Layout)
  : Layout;

function AppProviders() {
  const palette = usePalette();
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
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current && previousPath.current !== pathname && previousPath.current !== "/") void HapticPreset.back();
    previousPath.current = pathname;
  }, [pathname]);
  return <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: "minimal" }}>
    <Stack.Screen name="activity" options={{ ...pageHeaderOptions(palette, font), headerLargeTitleEnabled: false, title: "Activity" }} />
    <Stack.Screen name="credits" options={{ ...pageHeaderOptions(palette, font), headerLargeTitleEnabled: false, title: "Open source credits" }} />
    <Stack.Screen name="share/coding-week" options={{ ...pageHeaderOptions(palette, font), headerLargeTitleEnabled: false, title: "Coding week" }} />
    <Stack.Screen name="share/daily" options={{ ...pageHeaderOptions(palette, font), headerLargeTitleEnabled: false, title: "Coding day" }} />
    <Stack.Screen name="share/analytics" options={{ ...pageHeaderOptions(palette, font), headerLargeTitleEnabled: false, title: "Coding report" }} />
    <Stack.Screen name="share/leaderboard" options={{ ...pageHeaderOptions(palette, font), headerLargeTitleEnabled: false, title: "Leaderboard card" }} />
    <Stack.Screen name="profile/[id]" options={{ ...pageHeaderOptions(palette, font), title: "Profile" }} />
  </Stack>;
}
