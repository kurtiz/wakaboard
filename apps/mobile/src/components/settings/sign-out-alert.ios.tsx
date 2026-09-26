import { Host } from "@expo/ui";
import { Alert, Button, Text } from "@expo/ui/swift-ui";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SignOutAlert({ visible, onCancel, onConfirm }: Props) {
  return (
    <Host style={{ width: 1, height: 1 }}>
      <Alert title="Disconnect WakaTime?" isPresented={visible} onIsPresentedChange={(presented) => { if (!presented) onCancel(); }}>
        <Alert.Trigger><Text> </Text></Alert.Trigger>
        <Alert.Actions>
          <Button label="Disconnect" role="destructive" onPress={onConfirm} />
          <Button label="Cancel" role="cancel" onPress={onCancel} />
        </Alert.Actions>
        <Alert.Message><Text>You will need to connect again to sync your WakaTime activity.</Text></Alert.Message>
      </Alert>
    </Host>
  );
}
