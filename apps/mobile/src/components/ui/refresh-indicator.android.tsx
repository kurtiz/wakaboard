import { ActivityIndicator, View, type ColorValue } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePalette } from "../../theme";
import { Text } from "./app-text";
import { LoadingIndicator } from "./loading-indicator";

export function RefreshIndicator({ pulling, refreshing, progress, color }: {
  pulling: boolean;
  refreshing: boolean;
  progress: SharedValue<number>;
  color: ColorValue;
}) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const barStyle = useAnimatedStyle(() => ({ width: `${Math.round(progress.value * 100)}%` }));

  if (refreshing) return <View pointerEvents="none" style={{
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

  if (!pulling) return null;
  return <View pointerEvents="none" style={{ position: "absolute", top: insets.top + 66, left: 0, right: 0, alignItems: "center" }}>
    <View style={{ minWidth: 155, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 10, gap: 8, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, alignItems: "center", elevation: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ActivityIndicator size="small" color={color} />
        <Text style={{ color: palette.text, fontSize: 12, fontWeight: "700" }}>Pull to refresh</Text>
      </View>
      <View style={{ width: "100%", height: 3, borderRadius: 2, overflow: "hidden", backgroundColor: palette.track }}><Animated.View style={[{ height: 3, backgroundColor: color }, barStyle]} /></View>
    </View>
  </View>;
}
