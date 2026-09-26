import { Text, View, type StyleProp, type ViewStyle } from "react-native";

export function ShareBrand({ scale, light = false, style }: { scale: number; light?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap: 8 * scale }, style]}>
    <View style={{ width: 14 * scale, height: 16 * scale, flexDirection: "row", alignItems: "flex-end", gap: 2 * scale }}>
      {[9, 16, 12].map((height) => <View key={height} style={{ width: 3.3 * scale, height: height * scale, borderRadius: 2 * scale, backgroundColor: light ? "#73D5A2" : "#0D5C4D" }} />)}
    </View>
    <Text style={{ fontFamily: "Outfit", fontSize: 12 * scale, fontWeight: "800", letterSpacing: 1.5 * scale, color: light ? "#F7FBF6" : "#122B24" }}>WAKABOARD</Text>
  </View>;
}
