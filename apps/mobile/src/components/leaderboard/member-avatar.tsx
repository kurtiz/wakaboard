import { Text } from "../ui/app-text";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
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
  const [cache, setCache] = useState<{ photo: string; path: string | null; failed: boolean }>({ photo: photo ?? "", path: null, failed: false });

  useEffect(() => {
    let active = true;
    if (photo) void Image.getCachePathAsync(photo).then((path) => {
      if (active && path) {
        setCache((previous) => ({ photo, path: path.startsWith("file://") ? path : `file://${path}`, failed: previous.photo === photo && previous.failed }));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [photo]);

  return <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: dark ? palette.homeHeroChip : palette.track }}>
    <Text style={{ color: dark ? palette.homeHeroText : palette.primary, fontSize: size * 0.3, fontWeight: "800" }}>{fallbackText ?? initials(name)}</Text>
    {photo ? <Image source={{ uri: cache.photo === photo && cache.failed && cache.path ? cache.path : photo }} cachePolicy="memory-disk" contentFit="cover" recyclingKey={id} onError={() => setCache((previous) => previous.photo === photo ? { ...previous, failed: true } : { photo, path: null, failed: true })} style={{ position: "absolute", width: size, height: size }} accessibilityLabel={`${name}'s profile photo`} /> : null}
  </View>;
}
