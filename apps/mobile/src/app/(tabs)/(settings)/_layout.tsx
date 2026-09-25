import { Stack } from "expo-router";
import { usePalette } from "../../../theme";

export default function SettingsLayout() {
  const palette = usePalette();
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings", headerLargeTitle: true }} />
    </Stack>
  );
}
