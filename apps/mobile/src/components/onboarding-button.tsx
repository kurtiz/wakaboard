import type { ReactNode } from "react";
import { Pressable, Text, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { usePalette } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  trailing?: ReactNode;
};

export function OnboardingButton({ label, onPress, disabled = false, secondary = false, compact = false, trailing }: Props) {
  const palette = usePalette();
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const android = process.env.EXPO_OS === "android";
  const containerStyle: ViewStyle = { borderRadius: 14, overflow: "hidden", width: compact ? undefined : "100%" };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        android_ripple={{ color: secondary ? palette.secondaryRipple : palette.primaryRipple }}
        onPress={onPress}
        onPressIn={() => { if (android && !reduceMotion) scale.set(withTiming(0.96, { duration: 100 })); }}
        onPressOut={() => { if (android && !reduceMotion) scale.set(withSpring(1, { damping: 18, stiffness: 300 })); }}
        style={({ pressed }) => ({
          minHeight: compact ? 44 : secondary ? 48 : 54,
          paddingHorizontal: compact ? 10 : 18,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: secondary ? "transparent" : palette.primary,
          opacity: disabled ? 0.55 : pressed && !android ? 0.82 : 1,
        })}
      >
        <Text style={{ color: secondary ? palette.muted : palette.onPrimary, fontSize: secondary ? 13 : 15, fontWeight: "700" }}>{label}</Text>
        {trailing}
      </Pressable>
    </Animated.View>
  );
}
