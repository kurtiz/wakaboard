import { Text } from "../ui/app-text";
import { Image } from "expo-image";
import { View } from "react-native";
import { usePalette } from "../../theme";

function initials(name: string): string {
  const words = name.replace(/^@/, "").split(/[\s_-]+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function MemberAvatar({ id, name, photo, size, dark = false, fallbackText }: {
  id: string; name: string; photo?: string | null; size: number; dark?: boolean; fallbackText?: string;
}) {
  const palette = usePalette();
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: dark ? palette.homeHeroChip : palette.track }}>
    <Text style={{ color: dark ? palette.homeHeroText : palette.primary, fontSize: size * 0.3, fontWeight: "800" }}>{fallbackText ?? initials(name)}</Text>
    {photo ? <Image source={{ uri: photo }} cachePolicy="memory-disk" contentFit="cover" recyclingKey={id} style={{ position: "absolute", width: size, height: size }} accessibilityLabel={`${name}'s profile photo`} /> : null}
  </View>;
}
