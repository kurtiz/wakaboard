import { Alert } from "react-native";
import { useEffect, useRef } from "react";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SignOutAlert({ visible, onCancel, onConfirm }: Props) {
  const shown = useRef(false);

  useEffect(() => {
    if (!visible) {
      shown.current = false;
      return;
    }
    if (shown.current) return;
    shown.current = true;
    Alert.alert("Disconnect WakaTime?", "You will need to connect again to sync your WakaTime activity.", [
      { text: "Cancel", style: "cancel", onPress: onCancel },
      { text: "Disconnect", style: "destructive", onPress: onConfirm },
    ], { cancelable: true, onDismiss: onCancel });
  }, [visible, onCancel, onConfirm]);

  return null;
}
