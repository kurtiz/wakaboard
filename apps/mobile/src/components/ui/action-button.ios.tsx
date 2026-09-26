import { Button, Host, HStack, Image, ProgressView, RNHostView, Text } from "@expo/ui/swift-ui";
import { buttonBorderShape, buttonStyle, controlSize, disabled as disabledModifier, foregroundColor, frame, tint } from "@expo/ui/swift-ui/modifiers";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { usePalette } from "../../theme";
import type { ActionButtonProps } from "./action-button.types";

export function ActionButton({ label, onPress, disabled = false, secondary = false, compact = false, leading, trailing }: ActionButtonProps) {
  const palette = usePalette();
  const glass = isGlassEffectAPIAvailable();
  const height = compact ? 44 : secondary ? 48 : 54;
  const hasCustomLabel = Boolean(leading || trailing);
  const trailingContent = trailing ? (disabled ? <ProgressView /> : <Image systemName="chevron.right" />) : null;

  return <Host style={{ width: compact ? undefined : "100%", height }}>
    <Button
      onPress={onPress}
      label={hasCustomLabel ? undefined : label}
      modifiers={[
        buttonStyle(glass ? secondary ? "glass" : "glassProminent" : secondary ? "bordered" : "borderedProminent"),
        buttonBorderShape("capsule"),
        controlSize(compact ? "regular" : "large"),
        tint(palette.primary),
        frame({ minHeight: height, maxWidth: 10000 }),
        disabledModifier(disabled),
      ]}
    >
      {hasCustomLabel ? <HStack spacing={8}>
        {leading ? <RNHostView matchContents>{leading}</RNHostView> : null}
        <Text modifiers={leading ? [foregroundColor(palette.onPrimary)] : undefined}>{label}</Text>
        {trailingContent}
      </HStack> : undefined}
    </Button>
  </Host>;
}
