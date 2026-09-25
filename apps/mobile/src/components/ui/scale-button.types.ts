import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export type ScaleButtonProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
  disabled?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  glass?: "clear" | "regular";
};
