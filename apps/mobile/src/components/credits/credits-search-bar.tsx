import { useState } from "react";
import { Keyboard, Pressable, TextInput, View } from "react-native";
import { MagnifyingGlassIcon } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { usePalette } from "../../theme";
import type { CreditsSearchBarProps } from "./credits-search-bar.types";

export function CreditsSearchBar({ query, onChangeText }: CreditsSearchBarProps) {
  const palette = usePalette();
  const [open, setOpen] = useState(false);

  function close() {
    Keyboard.dismiss();
    onChangeText("");
    setOpen(false);
  }

  return <View style={{ alignItems: "flex-end" }}>
    {open ? <View style={{ width: "100%", height: 56, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 17, paddingRight: 6, borderRadius: 28, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, boxShadow: `0 4px 16px ${palette.cardShadow}`, elevation: 6 }}>
      <MagnifyingGlassIcon size={21} color={palette.primary} />
      <TextInput
        autoFocus
        accessibilityLabel="Search open source credits"
        value={query}
        onChangeText={onChangeText}
        placeholder="Search credits and licenses"
        placeholderTextColor={palette.muted}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={() => Keyboard.dismiss()}
        style={{ flex: 1, height: "100%", color: palette.text, fontSize: 15, paddingVertical: 0 }}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={query ? "Clear search" : "Close search"} onPress={() => query ? onChangeText("") : close()} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><XIcon size={19} color={palette.muted} /></Pressable>
    </View> : <Pressable accessibilityRole="button" accessibilityLabel="Search credits" onPress={() => setOpen(true)} style={({ pressed }) => ({ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: palette.primary, boxShadow: `0 4px 16px ${palette.cardShadow}`, elevation: 6, opacity: pressed ? 0.8 : 1 })}><MagnifyingGlassIcon size={23} color={palette.onPrimary} weight="bold" /></Pressable>}
  </View>;
}
