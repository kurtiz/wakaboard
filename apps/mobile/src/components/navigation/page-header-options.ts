import type { FontChoice } from "../../font-choice";
import type { usePalette } from "../../theme";

type Palette = ReturnType<typeof usePalette>;

export function pageHeaderOptions(palette: Palette, font?: FontChoice) {
  const ios = process.env.EXPO_OS === "ios";
  return {
    contentStyle: { backgroundColor: palette.background },
    headerLargeStyle: { backgroundColor: palette.background },
    headerLargeTitleEnabled: ios,
    headerLargeTitleShadowVisible: false,
    headerLargeTitleStyle: { color: palette.text, fontSize: 34, fontWeight: "800" as const, fontFamily: font },
    headerShadowVisible: false,
    headerShown: process.env.EXPO_OS !== "android",
    headerStyle: { backgroundColor: palette.background },
    headerTintColor: palette.text,
    headerTitleAlign: "left" as const,
    headerTitleStyle: { fontSize: ios ? 17 : 22, fontWeight: "800" as const, fontFamily: font },
    headerTransparent: false,
  };
}
