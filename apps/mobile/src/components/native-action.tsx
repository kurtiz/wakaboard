import { Button, Host } from "@expo/ui";

export function NativeAction({
  label,
  onPress,
  variant = "filled",
}: {
  label: string;
  onPress: () => void;
  variant?: "filled" | "outlined" | "text";
}) {
  return (
    <Host matchContents seedColor="#42B78B">
      <Button label={label} onPress={onPress} variant={variant} />
    </Host>
  );
}
