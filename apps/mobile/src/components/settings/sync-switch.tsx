import { Host, Switch } from "@expo/ui";
import { usePalette } from "../../theme";

type SyncSwitchProps = {
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
};

export function SyncSwitch({ value, disabled, onValueChange }: SyncSwitchProps) {
  const palette = usePalette();
  return <Host style={{ width: 56, height: 48 }} colorScheme={palette.scheme} seedColor={palette.accent}>
    <Switch value={value} disabled={disabled} onValueChange={onValueChange} testID="sync-on-open-switch" />
  </Host>;
}
