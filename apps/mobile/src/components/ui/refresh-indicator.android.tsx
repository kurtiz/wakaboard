import { View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "../../theme";
import { LoadingIndicator } from "./loading-indicator";

export function RefreshIndicator({ visible, color }: { visible: boolean; color: ColorValue }) {
  const insets = useSafeAreaInsets();
  const palette = usePalette();

  if (!visible) return null;
  return <View pointerEvents="none" style={{
    position: "absolute",
    top: insets.top + 3,
    alignSelf: "center",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: palette.card,
    elevation: 2,
  }}>
    <LoadingIndicator color={color} size="small" />
  </View>;
}
