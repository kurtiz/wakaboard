import { Pressable, Text } from "react-native";
import Animated from "react-native-reanimated";
import { usePalette } from "../../theme";
import { usePressScale } from "../ui/use-press-scale.android";
import type { OnboardingButtonProps } from "./onboarding-button.types";

export function OnboardingButton({ label, onPress, disabled = false, secondary = false, compact = false, trailing }: OnboardingButtonProps) {
  const palette = usePalette();
  const press = usePressScale(0.96);
  return <Animated.View style={[{ borderRadius: 14, overflow: "hidden", width: compact ? undefined : "100%" }, press.style]}>
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
      android_ripple={{ color: secondary ? palette.secondaryRipple : palette.primaryRipple }}
      onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}
      style={{ minHeight: compact ? 44 : secondary ? 48 : 54, paddingHorizontal: compact ? 10 : 18, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: secondary ? "transparent" : palette.primary, opacity: disabled ? 0.55 : 1 }}
    >
      <Text style={{ color: secondary ? palette.muted : palette.onPrimary, fontSize: secondary ? 13 : 15, fontWeight: "700" }}>{label}</Text>
      {trailing}
    </Pressable>
  </Animated.View>;
}
