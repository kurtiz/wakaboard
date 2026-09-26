import { Switch } from "react-native";
import { usePalette } from "../../theme";

export function ShareCardSwitch({ value, onValueChange, label }: { value: boolean; onValueChange: (value: boolean) => void; label: string }) {
  const palette = usePalette();
  return <Switch value={value} onValueChange={onValueChange} accessibilityLabel={label} trackColor={{ true: palette.primary }} />;
}
