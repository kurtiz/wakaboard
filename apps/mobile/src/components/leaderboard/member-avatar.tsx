import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { cacheAvatar, cachedAvatarUri } from "../../data/avatar-cache";
import { usePalette } from "../../theme";

function initials(name: string): string {
  const words = name.replace(/^@/, "").split(/[\s_-]+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function MemberAvatar({ id, name, photo, size, dark = false }: {
  id: string; name: string; photo?: string | null; size: number; dark?: boolean;
}) {
  const palette = usePalette();
  const [saved, setSaved] = useState(() => ({ id, uri: cachedAvatarUri(id) }));
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    if (photo) void cacheAvatar(id, photo).then((uri) => { if (uri) setSaved({ id, uri }); });
  }, [id, photo]);

  const source = photo === null ? null : (saved.id === id ? saved.uri : cachedAvatarUri(id)) ?? photo;
  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: dark ? palette.homeHeroChip : palette.track }}>
    <Text style={{ color: dark ? palette.homeHeroText : palette.primary, fontSize: size * 0.3, fontWeight: "800" }}>{initials(name)}</Text>
    {source && failedSource !== source ? <Image source={{ uri: source }} cachePolicy="memory-disk" contentFit="cover" onError={() => setFailedSource(source)} style={{ position: "absolute", width: size, height: size }} accessibilityLabel={`${name}'s profile photo`} /> : null}
  </View>;
}
