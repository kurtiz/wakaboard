import { Host, Switch } from "@expo/ui/jetpack-compose";
import { usePalette } from "../../theme";

type SyncSwitchProps = {
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
};

export function SyncSwitch({ value, disabled, onValueChange }: SyncSwitchProps) {
  const palette = usePalette();
  return <Host style={{ width: 56, height: 48 }} colorScheme={palette.scheme} seedColor={palette.accent}>
    <Switch
      value={value}
      enabled={!disabled}
      onCheckedChange={onValueChange}
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
