import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Line } from "react-native-svg";

export function DashedLine({ color, thickness = 1, dash = 4, style }: {
  color: string;
  thickness?: number;
  dash?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ height: thickness }, style]}>
    <Svg width="100%" height={thickness}>
      <Line x1="0" y1={thickness / 2} x2="100%" y2={thickness / 2} stroke={color} strokeWidth={thickness} strokeDasharray={`${dash} ${dash}`} />
    </Svg>
  </View>;
}
