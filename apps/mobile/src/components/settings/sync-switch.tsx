import { Host, Switch } from "@expo/ui";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

type SyncSwitchProps = {
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
};

export function SyncSwitch({ value, disabled, onValueChange, testID = "sync-on-open-switch" }: SyncSwitchProps) {
  const palette = usePalette();
  const handleValueChange = (nextValue: boolean) => {
    if (nextValue === value) return;
    void HapticPreset.selection();
    onValueChange(nextValue);
  };
  return <Host style={{ width: 56, height: 48 }} colorScheme={palette.scheme} seedColor={palette.accent}>
    <Switch value={value} disabled={disabled} onValueChange={handleValueChange} testID={testID} />
  </Host>;
}
