import { Pressable, View } from "react-native";
import type { ScaleButtonProps } from "./scale-button.types";

export function ScaleButton({ label, onPress, children, disabled = false, selected, style, wrapperStyle }: ScaleButtonProps) {
  return <View style={wrapperStyle}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} style={[style, disabled ? { opacity: 0.38 } : null]}>{children}</Pressable>
  </View>;
}
