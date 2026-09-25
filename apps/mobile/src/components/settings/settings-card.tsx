import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { usePalette } from "../../theme";
import { Text } from "../ui/app-text";

export function SettingsCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  const palette = usePalette();
  return <View style={{ backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 24, borderCurve: "continuous", padding: 18, gap: 16, boxShadow: `0 3px 16px ${palette.cardShadow}` }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      {icon}
      <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 18, fontWeight: "800" }}>{title}</Text>
    </View>
    {children}
  </View>;
}

export function SettingsButton({ label, onPress, disabled, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: ReactNode }) {
  const palette = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: 48, borderRadius: 999, borderCurve: "continuous", backgroundColor: palette.primary, opacity: disabled ? 0.5 : pressed ? 0.8 : 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 16 })}>
    {icon}
    <Text style={{ color: palette.onPrimary, fontSize: 14, fontWeight: "800" }}>{label}</Text>
  </Pressable>;
}
