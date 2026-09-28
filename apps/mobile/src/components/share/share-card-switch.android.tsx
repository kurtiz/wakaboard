import { Host, Switch } from "@expo/ui/jetpack-compose";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

export function ShareCardSwitch({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void; label: string }) {
  const palette = usePalette();
  const handleValueChange = (nextValue: boolean) => {
    if (nextValue === value) return;
    void HapticPreset.selection();
    onValueChange(nextValue);
  };
  return <Host style={{ width: 56, height: 48 }} colorScheme={palette.scheme} seedColor={palette.accent}>
    <Switch value={value} onCheckedChange={handleValueChange} colors={{
      checkedTrackColor: palette.primary,
      checkedThumbColor: palette.onPrimary,
      uncheckedTrackColor: palette.track,
      uncheckedThumbColor: palette.muted,
      uncheckedBorderColor: palette.border,
    }} />
  </Host>;
}
