import { useRef, useState } from "react";
import type { GestureResponderEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { HapticPreset } from "../../constants/haptics";

const VISIBLE_PULL = 8;
const HAPTIC_PULL = 44;
const FULL_PULL_HINT = 120;

/** Observes the gesture without taking it away from the native RefreshControl. */
export function usePullRefreshFeedback(scrollOffset: SharedValue<number>, refreshing: boolean) {
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const iosScrollOffset = useRef(0);
  const started = useRef(false);
  const ticked = useRef(false);
  const [pulling, setPulling] = useState(false);
  const progress = useSharedValue(0);

  function reset() {
    startY.current = null;
    startX.current = null;
    started.current = false;
    ticked.current = false;
    progress.value = 0;
    setPulling(false);
  }

  function onTouchStart(event: GestureResponderEvent) {
    if (refreshing) return;
    startY.current = event.nativeEvent.pageY;
    startX.current = event.nativeEvent.pageX;
    started.current = false;
    ticked.current = false;
  }

  function onTouchMove(event: GestureResponderEvent) {
    if (startY.current === null || refreshing || (process.env.EXPO_OS === "android" ? scrollOffset.value : iosScrollOffset.current) > 1) return;
    const distance = Math.max(0, event.nativeEvent.pageY - startY.current);
    if (startX.current !== null && distance < Math.abs(event.nativeEvent.pageX - startX.current)) return;
    // The native control owns the actual trigger threshold, so never imply it is reached here.
    if (process.env.EXPO_OS === "android") {
      progress.value = Math.min(0.9, distance / FULL_PULL_HINT);
      setPulling(distance >= VISIBLE_PULL);
    }
    if (distance >= VISIBLE_PULL && !started.current) {
      started.current = true;
      void HapticPreset.selection();
    }
    if (distance >= HAPTIC_PULL && !ticked.current) {
      ticked.current = true;
      void HapticPreset.soft();
    }
  }

  function onScrollBeginDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (process.env.EXPO_OS !== "android") iosScrollOffset.current = Math.max(0, event.nativeEvent.contentOffset.y);
  }

  return { pulling, progress, onTouchStart, onTouchMove, onTouchEnd: reset, onTouchCancel: reset, onScrollBeginDrag };
}
