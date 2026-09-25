import { Stack } from "expo-router";
import { pageHeaderOptions } from "../../../components/navigation/page-header-options";
import { useFontChoice } from "../../../font-choice";
import { usePalette } from "../../../theme";

export default function InsightsLayout() {
  const palette = usePalette();
  const { font } = useFontChoice();
  return (
    <Stack screenOptions={pageHeaderOptions(palette, font)}>
      <Stack.Screen name="index" options={{ title: "Analytics" }} />
    </Stack>
  );
}
