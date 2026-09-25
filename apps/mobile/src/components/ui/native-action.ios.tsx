import { Button, Host } from "@expo/ui/swift-ui";
import { buttonBorderShape, buttonStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { usePalette } from "../../theme";

export function NativeAction({ label, onPress, variant = "filled" }: {
  label: string;
  onPress: () => void;
  variant?: "filled" | "outlined" | "text";
}) {
  const palette = usePalette();
  const glass = isGlassEffectAPIAvailable();
  const style = variant === "text" ? "plain" : glass
    ? variant === "filled" ? "glassProminent" : "glass"
    : variant === "filled" ? "borderedProminent" : "bordered";
  return <Host matchContents>
    <Button label={label} onPress={onPress} modifiers={[buttonStyle(style), buttonBorderShape("capsule"), tint(palette.primary)]} />
  </Host>;
}
