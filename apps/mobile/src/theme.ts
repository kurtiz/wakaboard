import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import { useCSSVariable, useUniwind } from "uniwind";

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

type Palette = Record<PaletteKey, string> & { scheme: "light" | "dark" };

const PaletteContext = createContext<Palette | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const { theme } = useUniwind();
  const values = useCSSVariable(variables);
  const scheme = theme === "dark" || theme.endsWith("-dark") ? "dark" : "light";
  const palette = useMemo(() => {
    const colors = Object.fromEntries(names.map((name, index) => [name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), values[index]]));
    return { ...colors, scheme } as Palette;
  }, [values, scheme]);
  return createElement(PaletteContext.Provider, { value: palette }, children);
}

export function usePalette(): Palette {
  const palette = useContext(PaletteContext);
  if (!palette) throw new Error("usePalette must be used inside PaletteProvider");
  return palette;
}

type CamelCase<S extends string> = S extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<CamelCase<Tail>>}` : S;
