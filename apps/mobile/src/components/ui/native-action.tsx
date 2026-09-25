import { Button, Host } from "@expo/ui";
import { usePalette } from "../../theme";

export function NativeAction({
  label,
  onPress,
  variant = "filled",
}: {
  label: string;
  onPress: () => void;
  variant?: "filled" | "outlined" | "text";
}) {
  const palette = usePalette();
  return (
    <Host matchContents seedColor={palette.accent}>
      <Button label={label} onPress={onPress} variant={variant} />
    </Host>
  );
}
