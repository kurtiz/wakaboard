import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";
import { Uniwind } from "uniwind";

export type ThemeMode = "system" | "light" | "dark";
export type AccentChoice = "pine" | "ember" | "indigo" | "berry" | "mono";

const listeners = new Set<() => void>();
const read = (key: string) => {
  try { return Storage.getItemSync(key); } catch { return null; }
};

let themeMode: ThemeMode = read("app-theme") === "light" ? "light" : read("app-theme") === "dark" ? "dark" : "system";
let accentChoice: AccentChoice = (() => {
  const saved = read("app-accent");
  return saved === "ember" || saved === "indigo" || saved === "berry" || saved === "mono" ? saved : "pine";
})();
let initialized = false;

function deviceTheme(): "light" | "dark" {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

function applyThemeMode(mode: ThemeMode) {
  if (mode !== "system" || process.env.EXPO_OS === "web") {
    Uniwind.setTheme(mode);
    return;
  }

  // React Native 0.86 expects "unspecified" to follow Android/iOS settings.
  // Uniwind 1.0.5 passes undefined here, which crashes Android's native module.
  Appearance.setColorScheme("unspecified");
  const next = deviceTheme();
  if (!Uniwind.hasAdaptiveThemes || Uniwind.currentTheme !== next) {
    Uniwind.setTheme(next);
    Appearance.setColorScheme("unspecified");
  }
}

export function initializeAppearance() {
  if (initialized) return;
  initialized = true;
  if (process.env.EXPO_OS !== "web") {
    Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode !== "system") return;
      const next = colorScheme === "dark" ? "dark" : "light";
      if (Uniwind.currentTheme !== next) {
        Uniwind.setTheme(next);
        Appearance.setColorScheme("unspecified");
      }
    });
  }
  applyThemeMode(themeMode);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify() { listeners.forEach((listener) => listener()); }

export function useAppearancePreferences() {
  const mode = useSyncExternalStore(subscribe, () => themeMode, () => "system" as ThemeMode);
  const accent = useSyncExternalStore(subscribe, () => accentChoice, () => "pine" as AccentChoice);
  return { mode, accent };
}

export async function setThemeMode(mode: ThemeMode) {
  const previous = themeMode;
  themeMode = mode;
  applyThemeMode(mode);
  notify();
  try { await Storage.setItem("app-theme", mode); }
  catch (error) {
    themeMode = previous;
    applyThemeMode(previous);
    notify();
    throw error;
  }
}

export async function setAccentChoice(accent: AccentChoice) {
  const previous = accentChoice;
  accentChoice = accent;
  notify();
  try { await Storage.setItem("app-accent", accent); }
  catch (error) {
    accentChoice = previous;
    notify();
    throw error;
  }
}
