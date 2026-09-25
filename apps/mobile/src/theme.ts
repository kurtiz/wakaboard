import { useColorScheme } from "react-native";

export const accent = "#42B78B";

const light = {
  background: "#F5F7F3",
  card: "#FFFFFF",
  text: "#172922",
  muted: "#68766E",
  border: "#E3EAE4",
  track: "#DAE9DE",
  bar: "#8CDAB7",
  hero: "#112C24",
};

const dark = {
  background: "#0D1713",
  card: "#19251F",
  text: "#F3F8F3",
  muted: "#A5B5AA",
  border: "#2B3D32",
  track: "#344A3C",
  bar: "#4CA97D",
  hero: "#173C2F",
};

export function usePalette() {
  const scheme = useColorScheme();
  return { ...(scheme === "dark" ? dark : light), scheme: scheme ?? "light" };
}
