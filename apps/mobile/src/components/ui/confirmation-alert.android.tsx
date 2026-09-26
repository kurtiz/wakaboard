import { Host } from "@expo/ui";
import { AlertDialog, Text, TextButton } from "@expo/ui/jetpack-compose";
import { usePalette } from "../../theme";
import type { ConfirmationAlertProps } from "./confirmation-alert.types";

export function ConfirmationAlert({ visible, title, message, confirmLabel, tone, onCancel, onConfirm }: ConfirmationAlertProps) {
  const palette = usePalette();
  if (!visible) return null;

  const actionColor = tone === "destructive" ? palette.error : palette.primary;

  return (
    <Host matchContents>
      <AlertDialog onDismissRequest={onCancel}>
        <AlertDialog.Title><Text>{title}</Text></AlertDialog.Title>
        <AlertDialog.Text><Text>{message}</Text></AlertDialog.Text>
        <AlertDialog.ConfirmButton>
          <TextButton onClick={onConfirm} colors={{ contentColor: actionColor }}><Text color={actionColor}>{confirmLabel}</Text></TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton><TextButton onClick={onCancel}><Text>Cancel</Text></TextButton></AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}
