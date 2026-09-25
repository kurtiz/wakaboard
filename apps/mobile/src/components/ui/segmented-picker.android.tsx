import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { usePalette } from "../../theme";
import type { SegmentedPickerProps } from "./segmented-picker.types";

export function SegmentedPicker<T extends string | number>({ options, value, onChange, renderLeading }: SegmentedPickerProps<T>) {
  const palette = usePalette();
  const [width, setWidth] = useState(0);
  const initialized = useRef(false);
  const reducedMotion = useReducedMotion();
  const position = useSharedValue(0);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = options.length ? Math.max(0, width - 8) / options.length : 0;
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));

  useEffect(() => {
    if (!segmentWidth) return;
    const target = selectedIndex * segmentWidth;
    if (!initialized.current || reducedMotion) position.set(target);
    else position.set(withTiming(target, { duration: 240, easing: Easing.out(Easing.cubic) }));
    initialized.current = true;
  }, [position, reducedMotion, segmentWidth, selectedIndex]);

  return <View accessibilityRole="tablist" onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ flexDirection: "row", padding: 4, borderRadius: 999, backgroundColor: palette.homeSubtle }}>
    {segmentWidth > 0 ? <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 4, top: 4, bottom: 4, width: segmentWidth, borderRadius: 999, backgroundColor: palette.card }, indicatorStyle]} /> : null}
    {options.map((option) => {
      const selected = option.value === value;
      return <Pressable key={String(option.value)} accessibilityRole="tab" accessibilityLabel={option.accessibilityLabel ?? option.label} accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={{ flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 3 }}>
        {renderLeading?.(option.value, selected)}
        <Text numberOfLines={1} style={{ color: selected ? palette.primary : palette.muted, fontSize: 13, fontWeight: selected ? "800" : "600" }}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}
