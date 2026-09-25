import NativeSegmentedControl from "@expo/ui/community/segmented-control";
import { usePalette } from "../../theme";
import type { SegmentedPickerProps } from "./segmented-picker.types";

export function SegmentedPicker<T extends string | number>({ options, value, onChange }: SegmentedPickerProps<T>) {
  const palette = usePalette();
  return <NativeSegmentedControl
    values={options.map((option) => option.label)}
    selectedIndex={options.findIndex((option) => option.value === value)}
    onChange={(event) => {
      const next = options[event.nativeEvent.selectedSegmentIndex];
      if (next && next.value !== value) onChange(next.value);
    }}
    appearance={palette.scheme}
    style={{ width: "100%", height: 46 }}
  />;
}
