import { Host } from "@expo/ui";
import { AlertDialog, Text, TextButton } from "@expo/ui/jetpack-compose";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SignOutAlert({ visible, onCancel, onConfirm }: Props) {
  if (!visible) return null;

  return (
    <Host matchContents>
      <AlertDialog onDismissRequest={onCancel}>
        <AlertDialog.Title><Text>Disconnect WakaTime?</Text></AlertDialog.Title>
        <AlertDialog.Text><Text>You will need to connect again to sync your WakaTime activity.</Text></AlertDialog.Text>
        <AlertDialog.ConfirmButton><TextButton onClick={onConfirm}><Text>Disconnect</Text></TextButton></AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton><TextButton onClick={onCancel}><Text>Cancel</Text></TextButton></AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}
