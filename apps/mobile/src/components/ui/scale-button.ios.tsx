import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { Pressable, StyleSheet, View } from "react-native";
import { usePalette } from "../../theme";
import type { ScaleButtonProps } from "./scale-button.types";

export function ScaleButton({ label, onPress, children, disabled = false, selected, style, wrapperStyle, glass }: ScaleButtonProps) {
  const palette = usePalette();
  const useGlass = !!glass && isGlassEffectAPIAvailable();
  const flattened = StyleSheet.flatten(style);
  return <View style={wrapperStyle}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, useGlass ? { backgroundColor: "transparent", overflow: "hidden" } : null, { opacity: disabled ? 0.38 : pressed && !useGlass ? 0.7 : 1 }]}
    >
      {useGlass ? <GlassView
        isInteractive={!disabled}
        glassEffectStyle={glass}
        tintColor={glass === "regular" ? palette.primary : undefined}
        style={[StyleSheet.absoluteFill, { borderRadius: flattened?.borderRadius ?? 999 }]}
      /> : null}
      {children}
    </Pressable>
  </View>;
}
