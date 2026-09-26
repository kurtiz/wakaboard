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

function applyAppearance() {
  if (accentChoice === "pine") {
    Uniwind.setTheme(themeMode);
    return;
  }

  // Clear an earlier explicit override before reading the device preference.
  if (themeMode === "system" && process.env.EXPO_OS !== "web") {
    Appearance.setColorScheme("unspecified");
  }
  const scheme = themeMode === "system" ? deviceTheme() : themeMode;
  Uniwind.setTheme(`${accentChoice}-${scheme}`);
  if (themeMode !== "system" && process.env.EXPO_OS !== "web") {
    Appearance.setColorScheme(scheme);
  }
}

export function initializeAppearance() {
  if (initialized) return;
  initialized = true;
  if (process.env.EXPO_OS !== "web") {
    Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode !== "system" || accentChoice === "pine") return;
      const next = colorScheme === "dark" ? "dark" : "light";
      const theme = `${accentChoice}-${next}` as const;
      if (Uniwind.currentTheme !== theme) {
        Uniwind.setTheme(theme);
      }
    });
  }
  applyAppearance();
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
  applyAppearance();
  notify();
  try { await Storage.setItem("app-theme", mode); }
  catch (error) {
    themeMode = previous;
    applyAppearance();
    notify();
    throw error;
  }
}

export async function setAccentChoice(accent: AccentChoice) {
  const previous = accentChoice;
  accentChoice = accent;
  applyAppearance();
  notify();
  try { await Storage.setItem("app-accent", accent); }
  catch (error) {
    accentChoice = previous;
    applyAppearance();
    notify();
    throw error;
  }
}
