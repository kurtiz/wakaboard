import type { ColorValue } from "react-native";
import type { SharedValue } from "react-native-reanimated";

// iOS uses the React Native RefreshControl indicator for both pulling and loading.
export function RefreshIndicator(_props: {
  pulling: boolean;
  refreshing: boolean;
  progress: SharedValue<number>;
  color: ColorValue;
}) {
  return null;
}
