import { Host, Switch } from "@expo/ui/jetpack-compose";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

type SyncSwitchProps = {
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
};

export function SyncSwitch({ value, disabled, onValueChange }: SyncSwitchProps) {
  const palette = usePalette();
  const handleValueChange = (nextValue: boolean) => {
    if (nextValue === value) return;
    void HapticPreset.selection();
    onValueChange(nextValue);
  };
  return <Host style={{ width: 56, height: 48 }} colorScheme={palette.scheme} seedColor={palette.accent}>
    <Switch
      value={value}
      enabled={!disabled}
      onCheckedChange={handleValueChange}
      colors={{
        checkedTrackColor: palette.primary,
        checkedThumbColor: palette.onPrimary,
        uncheckedTrackColor: palette.track,
        uncheckedThumbColor: palette.muted,
        uncheckedBorderColor: palette.border,
      }}
    />
  </Host>;
}
