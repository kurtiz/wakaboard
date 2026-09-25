import { useCSSVariable, useUniwind } from "uniwind";
import { useAppearancePreferences } from "./appearance-preferences";

const names = [
  "background", "card", "text", "muted", "border", "track", "bar", "hero",
  "accent", "primary", "on-primary", "hero-title", "hero-kicker", "hero-muted",
  "hero-detail", "success", "error", "mint", "amber", "progress", "progress-track",
  "privacy-panel", "privacy-badge", "wakatime-tile", "wakatime-mark", "modal-backdrop",
  "readonly-badge", "no-code-badge", "user-badge", "secondary-ripple", "primary-ripple", "card-shadow", "home-hero-text", "home-hero-muted",
  "home-amber", "home-amber-text", "home-surface", "home-subtle", "home-hero",
  "home-hero-chip", "home-hero-track", "home-amber-surface", "home-mint-surface",
] as const;

const variables = names.map((name) => `--color-${name}`);

type PaletteKey = CamelCase<(typeof names)[number]>;

export function usePalette() {
  const { theme } = useUniwind();
  const { accent } = useAppearancePreferences();
  const values = useCSSVariable(variables);
  const colors = Object.fromEntries(names.map((name, index) => [name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), values[index]]));
  const accents = {
    pine: { light: "#0D5C4D", dark: "#34D399" },
    ember: { light: "#A45208", dark: "#FFB36A" },
    indigo: { light: "#3B5998", dark: "#A5B9F0" },
    berry: { light: "#A93232", dark: "#F1A2A2" },
    mono: { light: "#2C3E50", dark: "#CBD8E2" },
  };
  const scheme = theme === "dark" ? "dark" : "light";
  if (accent !== "pine") {
    const tint = accents[accent][scheme];
    Object.assign(colors, { primary: tint, accent: tint, bar: tint, progress: tint });
  }
  return { ...colors, scheme } as Record<PaletteKey, string> & { scheme: "light" | "dark" };
}

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<CamelCase<Tail>>}` : S;
