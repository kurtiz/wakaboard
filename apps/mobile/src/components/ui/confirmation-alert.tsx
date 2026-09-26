import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import type { ConfirmationAlertProps } from "./confirmation-alert.types";

export function ConfirmationAlert({ visible, title, message, confirmLabel, tone, onCancel, onConfirm }: ConfirmationAlertProps) {
  const shown = useRef(false);

  useEffect(() => {
    if (!visible) {
      shown.current = false;
      return;
    }
    if (shown.current) return;
    shown.current = true;
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: onCancel },
      { text: confirmLabel, style: tone === "destructive" ? "destructive" : "default", onPress: onConfirm },
    ], { cancelable: true, onDismiss: onCancel });
  }, [visible, title, message, confirmLabel, tone, onCancel, onConfirm]);

  return null;
}
