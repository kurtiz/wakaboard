import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import Storage from "expo-sqlite/kv-store";

export type FontChoice = "Nunito" | "Outfit";

type FontContextValue = {
  font: FontChoice;
  setFont: (font: FontChoice) => void;
};

export const FontContext = createContext<FontContextValue>({ font: "Nunito", setFont: () => {} });

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<FontChoice>(() => {
    try {
      return Storage.getItemSync("app-font") === "Outfit" ? "Outfit" : "Nunito";
    } catch {
      return "Nunito";
    }
  });
  function setFont(choice: FontChoice) {
    setFontState(choice);
    void Storage.setItem("app-font", choice).catch(() => {});
  }
  const value = useMemo(() => ({ font, setFont }), [font]);
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useFontChoice() {
  return useContext(FontContext);
}
