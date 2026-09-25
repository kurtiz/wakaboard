import { Host } from "@expo/ui";
import { LoadingIndicator as ComposeLoadingIndicator } from "@expo/ui/jetpack-compose";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { View, type ActivityIndicatorProps } from "react-native";

export function LoadingIndicator({ color, size: indicatorSize, style }: ActivityIndicatorProps) {
  return <View accessibilityRole="progressbar" style={[{ alignItems: "center", justifyContent: "center" }, style]}>
    <Host matchContents>
      <ComposeLoadingIndicator color={color} modifiers={indicatorSize === "small" ? [size(24, 24)] : undefined} />
    </Host>
  </View>;
}
