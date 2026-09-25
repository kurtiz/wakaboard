import type { ReactNode } from "react";

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
};

export type SegmentedPickerProps<T extends string | number> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  renderLeading?: (value: T, selected: boolean) => ReactNode;
};
