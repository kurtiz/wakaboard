import { useContext } from "react";
import { Text as NativeText, type TextProps } from "react-native";
import { FontContext } from "../../font-choice";

export function Text({ style, ...props }: TextProps) {
  const { font } = useContext(FontContext);
  return <NativeText {...props} style={[{ fontFamily: font }, style]} />;
}
