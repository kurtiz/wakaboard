import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Pressable, SectionList, View } from "react-native";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../components/navigation/android-page-header";
import { CreditsSearchBar } from "../components/credits/credits-search-bar";
import { Text } from "../components/ui/app-text";
import packages from "../data/open-source-packages.json";
import { usePalette } from "../theme";

type Credit = { name: string; license: string; version?: string; notice?: string; direct?: boolean };

const allSections: { title: string; data: Credit[] }[] = [
  { title: "App libraries", data: packages.filter((item) => item.direct) },
  { title: "Supporting libraries", data: packages.filter((item) => !item.direct) },
  { title: "Fonts", data: [
    { name: "Nunito", license: "OFL-1.1", notice: "Copyright 2014 The Nunito Project Authors" },
    { name: "Outfit", license: "OFL-1.1", notice: "Copyright 2021 The Outfit Project Authors" },
  ] },
  { title: "WakaBoard", data: [{ name: "WakaBoard source code", license: "MIT" }] },
];

const SEARCH_GAP = 12;
const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Credit>);

function licenseUrl(item: Credit) {
  if (item.license === "OFL-1.1") return "https://openfontlicense.org/open-font-license-official-text/";
  if (item.license === "MIT") return "https://opensource.org/license/mit";
  if (/^[A-Za-z0-9.-]+$/.test(item.license)) return `https://spdx.org/licenses/${item.license}.html`;
  return `https://www.npmjs.com/package/${item.name}/v/${item.version}`;
}

function CreditRow({ item }: { item: Credit }) {
  const palette = usePalette();
  const [error, setError] = useState(false);
  return <View style={{ backgroundColor: palette.card, borderBottomColor: palette.border, borderBottomWidth: 1, paddingHorizontal: 16 }}>
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${item.name}, ${item.license} license. Read license details`}
      onPress={() => { setError(false); void Linking.openURL(licenseUrl(item)).catch(() => setError(true)); }}
      style={({ pressed }) => ({ minHeight: 54, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, opacity: pressed ? 0.65 : 1 })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: palette.text, fontSize: 13, fontWeight: "700" }}>{item.name}</Text>
        {(item.version || item.notice) && <Text style={{ color: palette.muted, fontSize: 11 }}>{item.notice ?? `v${item.version}`}</Text>}
      </View>
      <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "700", maxWidth: 116, textAlign: "right" }}>{item.license}</Text>
      <CaretRightIcon size={15} color={palette.muted} />
    </Pressable>
    {error && <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 11, paddingBottom: 8 }}>Could not open the license page.</Text>}
  </View>;
}

export default function CreditsScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { offset, onScroll } = useAndroidPageScroll();
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const sections = useMemo(() => search
    ? allSections.map((section) => ({ ...section, data: section.data.filter((item) =>
      [item.name, item.version, item.license, item.notice].some((value) => value?.toLowerCase().includes(search)),
    ) })).filter((section) => section.data.length > 0)
    : allSections, [search]);
  const resultCount = sections.reduce((sum, section) => sum + section.data.length, 0);

  const content = <KeyboardAvoidingView
    behavior={process.env.EXPO_OS === "ios" ? "padding" : "height"}
    style={{ flex: 1, backgroundColor: palette.background }}
  >
    <AnimatedSectionList
      sections={sections}
      keyExtractor={(item) => `${item.name}@${item.version ?? "asset"}`}
      renderItem={({ item }) => <CreditRow item={item} />}
      renderSectionHeader={({ section }) => <View style={{ backgroundColor: palette.background, paddingTop: 18, paddingBottom: 8 }}><Text accessibilityRole="header" style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>{section.title} ({section.data.length})</Text></View>}
      ListHeaderComponent={<View style={{ gap: 12 }}>
        {process.env.EXPO_OS === "android" && <AndroidLargeTitle title="Open source credits" offset={offset} back />}
        <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 20 }}>Libraries used by WakaBoard, including their supporting packages, and bundled fonts. Tap a license to read its terms.</Text>
        {search && <Text style={{ color: palette.muted, fontSize: 12 }}>{resultCount} {resultCount === 1 ? "match" : "matches"}</Text>}
      </View>}
      ListEmptyComponent={<View style={{ alignItems: "center", paddingVertical: 52 }}><Text style={{ color: palette.text, fontSize: 15, fontWeight: "700" }}>No matching credits</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>Try a package name or license.</Text></View>}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onScroll={process.env.EXPO_OS === "android" ? onScroll : undefined}
      scrollEventThrottle={16}
      stickySectionHeadersEnabled={false}
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 56 + insets.bottom + SEARCH_GAP * 3 }}
    />
    <View pointerEvents="box-none" style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + SEARCH_GAP }}>
      <CreditsSearchBar query={query} onChangeText={setQuery} />
    </View>
  </KeyboardAvoidingView>;
  return process.env.EXPO_OS === "android" ? <AndroidPageFrame title="Open source credits" offset={offset} back>{content}</AndroidPageFrame> : content;
}
