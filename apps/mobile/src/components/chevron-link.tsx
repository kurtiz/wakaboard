import { Link, type Href } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { Pressable, Text, type StyleProp, type ViewStyle } from "react-native";

export function ChevronLink({ href, label, color, fontSize = 13, style }: {
  href: Href;
  label: string;
  color: string;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, opacity: pressed ? 0.65 : 1 }, style]}>
        <Text style={{ color, fontSize, fontWeight: "700" }}>{label}</Text>
        <CaretRightIcon color={color} size={fontSize + 3} weight="bold" />
      </Pressable>
    </Link>
  );
}
