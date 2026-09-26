import type { ReactElement, ReactNode } from "react";

export type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  leading?: ReactElement;
  trailing?: ReactNode;
};
