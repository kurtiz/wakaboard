import { Pressable, Text, View } from "react-native";
import { usePalette } from "../../theme";
import type { SegmentedPickerProps } from "./segmented-picker.types";

export function SegmentedPicker<T extends string | number>({ options, value, onChange }: SegmentedPickerProps<T>) {
  const palette = usePalette();
  return <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 4, padding: 4, borderRadius: 999, backgroundColor: palette.homeSubtle }}>
    {options.map((option) => <Pressable key={String(option.value)} accessibilityRole="tab" accessibilityState={{ selected: option.value === value }} onPress={() => onChange(option.value)} style={{ flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 999, backgroundColor: option.value === value ? palette.card : "transparent" }}>
      <Text style={{ color: option.value === value ? palette.primary : palette.muted, fontWeight: option.value === value ? "800" : "600" }}>{option.label}</Text>
    </Pressable>)}
  </View>;
}
