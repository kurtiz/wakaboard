import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import type { ScaleButtonProps } from "./scale-button.types";
import { usePressScale } from "./use-press-scale.android";

export function ScaleButton({ label, onPress, children, disabled = false, selected, style, wrapperStyle }: ScaleButtonProps) {
  const press = usePressScale();
  return <Animated.View style={[wrapperStyle, press.style]}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[style, disabled ? { opacity: 0.38 } : null]}
    >{children}</Pressable>
  </Animated.View>;
}
