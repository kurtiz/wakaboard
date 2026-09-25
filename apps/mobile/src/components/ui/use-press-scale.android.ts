import { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

const PRESS_IN = { duration: 100, easing: Easing.out(Easing.cubic) };
const PRESS_OUT = { duration: 150, easing: Easing.out(Easing.cubic) };

export function usePressScale(scaleDown = 0.95) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => { if (!reducedMotion) scale.set(withTiming(scaleDown, PRESS_IN)); },
    onPressOut: () => { if (!reducedMotion) scale.set(withTiming(1, PRESS_OUT)); },
  };
}
