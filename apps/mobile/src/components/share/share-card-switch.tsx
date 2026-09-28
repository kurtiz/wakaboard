import { Switch } from "react-native";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

export function ShareCardSwitch({ value, onValueChange, label }: { value: boolean; onValueChange: (value: boolean) => void; label: string }) {
  const palette = usePalette();
  const handleValueChange = (nextValue: boolean) => {
    if (nextValue === value) return;
    void HapticPreset.selection();
    onValueChange(nextValue);
  };
  return <Switch value={value} onValueChange={handleValueChange} accessibilityLabel={label} trackColor={{ true: palette.primary }} />;
}
