import { formatDuration } from "@wakaboard/core";
import { Text, View } from "react-native";

type Props = {
  maximumSeconds: number;
  height: number;
  top: number;
  left: number;
  lineColor: string;
  labelColor: string;
  fontSize?: number;
};

export function BarChartGuides({ maximumSeconds, height, top, left, lineColor, labelColor, fontSize = 9 }: Props) {
  const maximum = Math.max(0, maximumSeconds);
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: top + height }}>
    {([1, 0.5] as const).map((fraction) => <View key={fraction} style={{ position: "absolute", top: top + (1 - fraction) * height, left: 0, right: 0, height: 13, flexDirection: "row", alignItems: "flex-start" }}>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ width: left - 5, marginTop: -6, textAlign: "right", color: labelColor, fontFamily: "Outfit", fontWeight: "700", fontSize }}>{formatDuration(maximum * fraction)}</Text>
      <View style={{ flex: 1, borderTopWidth: 1, borderTopColor: lineColor, borderStyle: "dashed" }} />
    </View>)}
  </View>;
}
