import { Button, Host, HStack, Image, ProgressView, Text } from "@expo/ui/swift-ui";
import { buttonBorderShape, buttonStyle, controlSize, disabled as disabledModifier, frame, tint } from "@expo/ui/swift-ui/modifiers";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { usePalette } from "../../theme";
import type { OnboardingButtonProps } from "./onboarding-button.types";

export function OnboardingButton({ label, onPress, disabled = false, secondary = false, compact = false, trailing }: OnboardingButtonProps) {
  const palette = usePalette();
  const glass = isGlassEffectAPIAvailable();
  const height = compact ? 44 : secondary ? 48 : 54;

  return <Host style={{ width: compact ? undefined : "100%", height }}>
    <Button
      onPress={onPress}
      label={trailing ? undefined : label}
      modifiers={[
        buttonStyle(glass ? secondary ? "glass" : "glassProminent" : secondary ? "bordered" : "borderedProminent"),
        buttonBorderShape("capsule"),
        controlSize(compact ? "regular" : "large"),
        tint(palette.primary),
        frame({ minHeight: height, maxWidth: 10000 }),
        disabledModifier(disabled),
      ]}
    >
      {trailing ? <HStack spacing={8}>
        <Text>{label}</Text>
        {disabled ? <ProgressView /> : <Image systemName="chevron.right" />}
      </HStack> : undefined}
    </Button>
  </Host>;
}
