import { Stack } from "expo-router";
import { usePalette } from "../../../theme";

export default function LeaderboardLayout() {
  const palette = usePalette();
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: palette.background }, headerShadowVisible: false, headerStyle: { backgroundColor: palette.background }, headerTintColor: palette.text }}>
      <Stack.Screen name="index" options={{ title: "Leaderboards", headerLargeTitle: false }} />
      <Stack.Screen name="profile/[id]" options={{ title: "WakaTime profile", headerLargeTitle: false }} />
    </Stack>
  );
}
