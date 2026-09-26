import { Host } from "@expo/ui";
import { Alert, Button, Text } from "@expo/ui/swift-ui";
import { tint } from "@expo/ui/swift-ui/modifiers";
import { usePalette } from "../../theme";
import type { ConfirmationAlertProps } from "./confirmation-alert.types";

export function ConfirmationAlert({ visible, title, message, confirmLabel, tone, onCancel, onConfirm }: ConfirmationAlertProps) {
  const palette = usePalette();

  return (
    <Host style={{ width: 1, height: 1 }}>
      <Alert title={title} isPresented={visible} onIsPresentedChange={(presented) => { if (!presented) onCancel(); }}>
        <Alert.Trigger><Text> </Text></Alert.Trigger>
        <Alert.Actions>
          <Button label={confirmLabel} role={tone === "destructive" ? "destructive" : "default"} modifiers={tone === "positive" ? [tint(palette.primary)] : undefined} onPress={onConfirm} />
          <Button label="Cancel" role="cancel" onPress={onCancel} />
        </Alert.Actions>
        <Alert.Message><Text>{message}</Text></Alert.Message>
      </Alert>
    </Host>
  );
}
