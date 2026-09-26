import { Button, GlassEffectContainer, HStack, Host, Image, Text, TextField, type TextFieldRef, useNativeState } from "@expo/ui/swift-ui";
import { accessibilityLabel, background, buttonStyle, clipShape, font, foregroundStyle, frame, glassEffect, padding, submitLabel, textInputAutocapitalization, autocorrectionDisabled } from "@expo/ui/swift-ui/modifiers";
import { isGlassEffectAPIAvailable } from "expo-glass-effect";
import { useEffect, useRef } from "react";
import { useFontChoice } from "../../font-choice";
import { usePalette } from "../../theme";
import type { CreditsSearchBarProps } from "./credits-search-bar.types";

export function CreditsSearchBar({ query, onChangeText }: CreditsSearchBarProps) {
  const palette = usePalette();
  const { font: appFont } = useFontChoice();
  const nativeText = useNativeState(query);
  const lastNativeText = useRef(query);
  const fieldRef = useRef<TextFieldRef>(null);
  const glass = isGlassEffectAPIAvailable();

  useEffect(() => {
    if (query !== lastNativeText.current) {
      lastNativeText.current = query;
      nativeText.set(query);
    }
  }, [nativeText, query]);

  function clear() {
    lastNativeText.current = "";
    nativeText.set("");
    onChangeText("");
    void fieldRef.current?.focus();
  }

  return <Host style={{ width: "100%", height: 50 }} colorScheme={palette.scheme} seedColor={palette.primary} ignoreSafeArea="all">
    <GlassEffectContainer spacing={12}>
      <HStack spacing={10} modifiers={[
        padding({ leading: 16, trailing: query ? 10 : 16 }),
        frame({ height: 50, maxWidth: Infinity }),
        ...(glass ? [glassEffect({ glass: { variant: "regular", interactive: true }, shape: "capsule" })] : [background(palette.card), clipShape("capsule")]),
      ]}>
        <Image systemName="magnifyingglass" color={palette.muted} modifiers={[font({ size: 17, weight: "semibold" })]} />
        <TextField
          ref={fieldRef}
          text={nativeText}
          placeholder="Search credits and licenses"
          onTextChange={(value) => { lastNativeText.current = value; onChangeText(value); }}
          modifiers={[
            font({ family: appFont, size: 15 }),
            foregroundStyle(palette.text),
            frame({ maxWidth: Infinity }),
            submitLabel("search"),
            autocorrectionDisabled(),
            textInputAutocapitalization("never"),
          ]}
        >
          <TextField.Placeholder><Text modifiers={[font({ family: appFont, size: 15 }), foregroundStyle(palette.muted)]}>Search credits and licenses</Text></TextField.Placeholder>
        </TextField>
        {query ? <Button onPress={clear} modifiers={[buttonStyle("plain"), accessibilityLabel("Clear search")]}><Image systemName="xmark.circle.fill" color={palette.muted} modifiers={[font({ size: 18 })]} /></Button> : null}
      </HStack>
    </GlassEffectContainer>
  </Host>;
}
