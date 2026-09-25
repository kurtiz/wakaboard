import { useLayoutEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { usePalette } from "../../theme";
import type { SegmentedPickerProps } from "./segmented-picker.types";

export function SegmentedPicker<T extends string | number>({ options, value, onChange, renderLeading }: SegmentedPickerProps<T>) {
  const palette = usePalette();
  const [width, setWidth] = useState(0);
  const initialized = useRef(false);
  const indicatorTarget = useRef(0);
  const selectedValue = useRef(value);
  const reducedMotion = useReducedMotion();
  const position = useSharedValue(0);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = options.length ? Math.max(0, width - 8) / options.length : 0;
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));

  useLayoutEffect(() => {
    selectedValue.current = value;
  }, [value]);

  useLayoutEffect(() => {
    if (!segmentWidth) return;
    const target = selectedIndex * segmentWidth;
    if (initialized.current && indicatorTarget.current === target && !reducedMotion) return;
    indicatorTarget.current = target;
    if (!initialized.current || reducedMotion) position.set(target);
    else position.set(withTiming(target, { duration: 160, easing: Easing.out(Easing.cubic) }));
    initialized.current = true;
  }, [position, reducedMotion, segmentWidth, selectedIndex]);

  function select(nextValue: T, index: number) {
    if (selectedValue.current === nextValue) return;
    selectedValue.current = nextValue;
    if (segmentWidth) {
      const target = index * segmentWidth;
      indicatorTarget.current = target;
      position.set(reducedMotion ? target : withTiming(target, { duration: 160, easing: Easing.out(Easing.cubic) }));
    }
    onChange(nextValue);
  }

  return <View accessibilityRole="tablist" onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={{ flexDirection: "row", padding: 4, borderRadius: 999, backgroundColor: palette.homeSubtle }}>
    {segmentWidth > 0 ? <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 4, top: 4, bottom: 4, width: segmentWidth, borderRadius: 999, backgroundColor: palette.card }, indicatorStyle]} /> : null}
    {options.map((option, index) => {
      const selected = option.value === value;
      return <Pressable key={String(option.value)} accessibilityRole="tab" accessibilityLabel={option.accessibilityLabel ?? option.label} accessibilityState={{ selected }} onPressIn={() => select(option.value, index)} onPress={() => select(option.value, index)} style={{ flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 3 }}>
        {renderLeading?.(option.value, selected)}
        <Text numberOfLines={1} style={{ color: selected ? palette.primary : palette.muted, fontSize: 13, fontWeight: selected ? "800" : "600" }}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}
