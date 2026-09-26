import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Pressable, StyleSheet, View } from "react-native";
import { usePalette } from "../../theme";
import type { ScaleButtonProps } from "./scale-button.types";

export function ScaleButton({ label, onPress, children, disabled = false, selected, style, wrapperStyle, glass }: ScaleButtonProps) {
  const palette = usePalette();
  const useGlass = !!glass && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const flattened = StyleSheet.flatten(style);
  const button = <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled, selected }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [style, useGlass ? { backgroundColor: "transparent" } : null, { opacity: disabled ? 0.38 : pressed && !useGlass ? 0.7 : 1 }]}
  >
    {children}
  </Pressable>;
  return <View style={wrapperStyle}>
    {useGlass ? <GlassView
      isInteractive={!disabled}
      glassEffectStyle={glass}
      colorScheme={palette.scheme}
      tintColor={glass === "regular" ? palette.primary : undefined}
      style={{ borderRadius: flattened?.borderRadius ?? 999, alignSelf: flattened?.alignSelf }}
    >{button}</GlassView> : button}
  </View>;
}
