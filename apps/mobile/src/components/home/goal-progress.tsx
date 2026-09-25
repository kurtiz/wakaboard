import { usePalette } from "../../theme";
import { View } from "react-native";

export function GoalProgress({ progress }: { progress: number }) {
  const palette = usePalette();
  return (
    <View style={{ backgroundColor: palette.progressTrack, borderRadius: 6, height: 8 }}>
      <View
        style={{
          backgroundColor: palette.progress,
          borderRadius: 6,
          height: 8,
          width: `${Math.round(progress * 100)}%`,
        }}
      />
    </View>
  );
}
