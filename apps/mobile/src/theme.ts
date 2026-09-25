import { useColorScheme } from "react-native";
import { useCSSVariable } from "uniwind";

const names = [
  "background", "card", "text", "muted", "border", "track", "bar", "hero",
  "accent", "primary", "on-primary", "hero-title", "hero-kicker", "hero-muted",
  "hero-detail", "success", "error", "mint", "amber", "progress", "progress-track",
  "privacy-panel", "privacy-badge", "wakatime-tile", "wakatime-mark",
  "readonly-badge", "no-code-badge", "user-badge", "secondary-ripple", "primary-ripple", "card-shadow", "home-hero-text", "home-hero-muted",
  "home-amber", "home-amber-text", "home-surface", "home-subtle", "home-hero",
  "home-hero-chip", "home-hero-track", "home-amber-surface", "home-mint-surface",
] as const;

const variables = names.map((name) => `--color-${name}`);

type PaletteKey = CamelCase<(typeof names)[number]>;

export function usePalette() {
  const scheme = useColorScheme();
  const values = useCSSVariable(variables);
  const colors = Object.fromEntries(names.map((name, index) => [name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), values[index]]));
  return { ...colors, scheme: scheme ?? "light" } as Record<PaletteKey, string> & { scheme: "light" | "dark" };
}

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<CamelCase<Tail>>}` : S;
