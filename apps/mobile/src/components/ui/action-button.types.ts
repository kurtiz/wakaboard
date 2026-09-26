import type { ReactNode } from "react";

export type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  trailing?: ReactNode;
};
