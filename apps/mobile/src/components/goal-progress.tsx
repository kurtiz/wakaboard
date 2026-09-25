import { View } from "react-native";

export function GoalProgress({ progress }: { progress: number }) {
  return (
    <View style={{ backgroundColor: "#315448", borderRadius: 6, height: 8 }}>
      <View
        style={{
          backgroundColor: "#70D8A5",
          borderRadius: 6,
          height: 8,
          width: `${Math.round(progress * 100)}%`,
        }}
      />
    </View>
  );
}
