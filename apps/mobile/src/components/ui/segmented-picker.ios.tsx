import { Host, Picker, Text } from "@expo/ui/swift-ui";
import { controlSize, glassEffect, padding, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { Platform } from "react-native";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";
import type { SegmentedPickerProps } from "./segmented-picker.types";

const supportsGlass = Number(Platform.Version) >= 26;

export function SegmentedPicker<T extends string | number>({ options, value, onChange }: SegmentedPickerProps<T>) {
  const palette = usePalette();
  return <Host style={{ width: "100%", height: 54 }} colorScheme={palette.scheme} seedColor={palette.accent}>
    <Picker
      label="Select view"
      selection={value}
      onSelectionChange={(next: T) => {
        if (next !== value) {
          void HapticPreset.selection();
          onChange(next);
        }
      }}
      modifiers={[
        pickerStyle("segmented"),
        controlSize("large"),
        padding({ vertical: 4 }),
        ...(supportsGlass ? [glassEffect({ glass: { variant: "regular", interactive: true }, shape: "capsule" })] : []),
      ]}
    >
      {options.map((option) => <Text key={String(option.value)} modifiers={[tag(option.value)]}>{option.label}</Text>)}
    </Picker>
  </Host>;
}
