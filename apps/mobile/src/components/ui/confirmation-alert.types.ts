export type ConfirmationAlertProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone: "destructive" | "positive";
  onCancel: () => void;
  onConfirm: () => void;
};
