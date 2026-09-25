import { Text } from "../ui/app-text";
import { Pressable, View } from "react-native";
import { usePalette } from "../../theme";
import type { OnboardingButtonProps } from "./onboarding-button.types";

export function OnboardingButton({ label, onPress, disabled = false, secondary = false, compact = false, trailing }: OnboardingButtonProps) {
  const palette = usePalette();
  return <View style={{ width: compact ? undefined : "100%" }}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={{ minHeight: compact ? 44 : secondary ? 48 : 54, paddingHorizontal: compact ? 10 : 18, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: secondary ? palette.track : palette.primary, opacity: disabled ? 0.55 : 1 }}>
      <Text style={{ color: secondary ? palette.muted : palette.onPrimary, fontSize: secondary ? 13 : 15, fontWeight: "700" }}>{label}</Text>
      {trailing}
    </Pressable>
  </View>;
}
