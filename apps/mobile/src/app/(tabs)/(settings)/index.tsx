import { Host, Slider } from "@expo/ui";
import { formatDuration } from "@wakaboard/core";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowsClockwiseIcon } from "phosphor-react-native/src/icons/ArrowsClockwise";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { CloudArrowDownIcon } from "phosphor-react-native/src/icons/CloudArrowDown";
import { PaletteIcon } from "phosphor-react-native/src/icons/Palette";
import { ShieldCheckIcon } from "phosphor-react-native/src/icons/ShieldCheck";
import { TargetIcon } from "phosphor-react-native/src/icons/Target";
import { TrashIcon } from "phosphor-react-native/src/icons/Trash";
import { MinusIcon } from "phosphor-react-native/src/icons/Minus";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { useEffect, useState } from "react";
import { Alert, Pressable, Switch, View } from "react-native";
import Animated from "react-native-reanimated";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../../../components/navigation/android-page-header";
import { SettingsButton, SettingsCard } from "../../../components/settings/settings-card";
import { Text as AppText } from "../../../components/ui/app-text";
import { HapticPreset } from "../../../constants/haptics";
import { setAccentChoice, setThemeMode, useAppearancePreferences, type AccentChoice, type ThemeMode } from "../../../appearance-preferences";
import { useDashboard } from "../../../data/dashboard-context";
import { loadOfflineStats } from "../../../data/dashboard-store";
import { useLeaderboards } from "../../../data/leaderboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../../data/wakatime-client";
import { isAutoSyncEnabled, setAutoSyncEnabled } from "../../../data/offline-preferences";
import { useFontChoice } from "../../../font-choice";
import { runManualRefresh } from "../../../haptic-actions";
import { usePalette } from "../../../theme";

export default function SettingsScreen() {
  const palette = usePalette();
  const { offset, onScroll } = useAndroidPageScroll();
  const { font, setFont } = useFontChoice();
  const { mode, accent } = useAppearancePreferences();
  const { goalSeconds, summaries, setGoalHours, clearSample, clearWakaTime, syncWakaTime, syncing, syncError } = useDashboard();
  const { currentProfile, refresh: refreshLeaderboards, clear: clearLeaderboards } = useLeaderboards();
  const [draftHours, setDraftHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(isAutoSyncEnabled);
  const [preferenceBusy, setPreferenceBusy] = useState(false);
  const [clearingOffline, setClearingOffline] = useState(false);
  const [offlineStats, setOfflineStats] = useState<{ days: number; bytes: number } | null>(null);
  const selectedHours = draftHours ?? goalSeconds / 3600;
  const hasSample = summaries.some((day) => day.source === "sample");
  const savedDays = offlineStats?.days ?? summaries.filter((day) => day.source === "wakatime").length;
  const storageSize = offlineStats ? offlineStats.bytes >= 1024 * 1024 ? `${(offlineStats.bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(offlineStats.bytes / 1024)} KB` : "—";
  const latestSaved = summaries.find((day) => day.source === "wakatime")?.date;
  const latestSavedLabel = latestSaved ? new Date(`${latestSaved}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const profileName = currentProfile?.name || accountName || accountEmail || "WakaTime";
  const initials = profileName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  useEffect(() => {
    if (wakatimeConnectionAvailable) {
      void authClient.getSession()
        .then(({ data }) => { setAccountEmail(data?.user.email ?? null); setAccountName(data?.user.name ?? null); })
        .catch(() => { setAccountEmail(null); setAccountName(null); });
    }
  }, []);

  useEffect(() => {
    let active = true;
    void loadOfflineStats().then((stats) => { if (active) setOfflineStats(stats); }).catch(() => {});
    return () => { active = false; };
  }, [summaries]);

  async function connect() {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const { error } = await authClient.signIn.social({ provider: "wakatime", callbackURL: "/" });
      if (error) throw new Error(error.message);
      const { data } = await authClient.getSession();
      setAccountEmail(data?.user.email ?? null);
      setAccountName(data?.user.name ?? null);
      if (data?.user) await Promise.all([syncWakaTime(), refreshLeaderboards()]);
      if (data?.user) void HapticPreset.confirm();
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "WakaTime sign-in failed.");
      void HapticPreset.error();
    } finally {
      setAccountBusy(false);
    }
  }

  async function signOut() {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message);
      await clearWakaTime();
      clearLeaderboards();
      setAccountEmail(null);
      setAccountName(null);
      void HapticPreset.confirm();
      router.replace("/auth");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Could not sign out.");
      void HapticPreset.error();
    } finally {
      setAccountBusy(false);
    }
  }

  async function saveGoal() {
    setSaving(true);
    setGoalError(null);
    try {
      await setGoalHours(selectedHours);
      setDraftHours(null);
      void HapticPreset.confirm();
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : "Could not save your goal.");
      void HapticPreset.error();
    } finally {
      setSaving(false);
    }
  }

  async function removeSample() {
    setDataError(null);
    try {
      await clearSample();
      void HapticPreset.confirm();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not remove sample activity.");
      void HapticPreset.error();
    }
  }

  async function changeAutoSync(enabled: boolean) {
    if (preferenceBusy) return;
    setAutoSync(enabled);
    setPreferenceBusy(true);
    setDataError(null);
    try {
      await setAutoSyncEnabled(enabled);
    } catch {
      setAutoSync(!enabled);
      setDataError("Could not save your sync preference.");
      void HapticPreset.error();
    } finally {
      setPreferenceBusy(false);
    }
  }

  function confirmClearOffline() {
    if (process.env.EXPO_OS === "web") {
      if (globalThis.confirm("Remove downloaded WakaTime activity from this device? You can sync it again while connected.")) {
        void clearOfflineActivity();
      }
      return;
    }
    Alert.alert(
      "Remove saved activity?",
      "Downloaded WakaTime activity will be removed from this device. You can sync it again while connected.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => void clearOfflineActivity() },
      ],
    );
  }

  async function clearOfflineActivity() {
    setClearingOffline(true);
    setDataError(null);
    try {
      await clearWakaTime();
      void HapticPreset.confirm();
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Could not remove saved activity.");
      void HapticPreset.error();
    } finally {
      setClearingOffline(false);
    }
  }

  function chooseFont(choice: "Nunito" | "Outfit") {
    if (font === choice) return;
    void HapticPreset.selection();
    setFont(choice);
  }

  async function chooseTheme(choice: ThemeMode) {
    if (mode === choice) return;
    setAppearanceError(null);
    try { await setThemeMode(choice); void HapticPreset.selection(); }
    catch { setAppearanceError("Could not save the theme."); }
  }

  async function chooseAccent(choice: AccentChoice) {
    if (accent === choice) return;
    setAppearanceError(null);
    try { await setAccentChoice(choice); void HapticPreset.selection(); }
    catch { setAppearanceError("Could not save the accent."); }
  }

  function adjustGoal(delta: number) {
    setDraftHours(Math.max(0.5, Math.min(12, selectedHours + delta)));
    void HapticPreset.selection();
  }

  const content = <Animated.ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={process.env.EXPO_OS === "android" ? onScroll : undefined} scrollEventThrottle={16} style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ alignItems: "center", paddingHorizontal: 16, paddingBottom: 48 }}>
    <View style={{ width: "100%", maxWidth: 560, gap: 14 }}>
      {process.env.EXPO_OS === "android" && <AndroidLargeTitle title="Settings" offset={offset} />}

      <View style={{ backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 24, borderCurve: "continuous", padding: 18, gap: 14, boxShadow: `0 3px 16px ${palette.cardShadow}` }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden", backgroundColor: palette.privacyPanel, alignItems: "center", justifyContent: "center" }}>
            {currentProfile?.photo ? <Image source={{ uri: currentProfile.photo }} cachePolicy="memory-disk" contentFit="cover" style={{ width: 48, height: 48 }} accessibilityLabel={`${profileName}'s profile photo`} /> : <AppText style={{ color: palette.primary, fontSize: 17, fontWeight: "800" }}>{initials}</AppText>}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <AppText numberOfLines={1} style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>{accountEmail ? profileName : "WakaTime account"}</AppText>
            <AppText numberOfLines={1} selectable style={{ color: palette.muted, fontSize: 12 }}>{accountEmail ?? (wakatimeConnectionAvailable ? "Connect to sync coding activity" : "Connection unavailable")}</AppText>
          </View>
          {accountEmail && <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: palette.privacyPanel, alignItems: "center", justifyContent: "center" }}><CheckIcon size={17} weight="bold" color={palette.primary} /></View>}
        </View>
        {wakatimeConnectionAvailable && (accountEmail
          ? <View style={{ minHeight: 34, borderRadius: 11, backgroundColor: palette.homeSurface, flexDirection: "row", alignItems: "center", paddingHorizontal: 11, gap: 7 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: palette.success }} /><AppText style={{ color: palette.primary, fontSize: 12, fontWeight: "700" }}>Connected to WakaTime</AppText></View>
          : <SettingsButton label={accountBusy ? "Connecting…" : "Connect WakaTime"} disabled={accountBusy} onPress={() => void connect()} />)}
        {accountError && <AppText accessibilityRole="alert" style={{ color: palette.error, fontSize: 12 }}>{accountError}</AppText>}
      </View>

      <SettingsCard title="Appearance" icon={<PaletteIcon size={20} weight="duotone" color={palette.primary} />}>
        <View accessibilityRole="radiogroup" style={{ flexDirection: "row", backgroundColor: palette.homeSubtle, padding: 4, borderRadius: 14, gap: 3 }}>
          {(["system", "light", "dark"] as const).map((choice) => <Pressable key={choice} accessibilityRole="radio" accessibilityLabel={`${choice} theme`} accessibilityState={{ checked: mode === choice }} onPress={() => void chooseTheme(choice)} style={{ flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: mode === choice ? palette.card : "transparent", justifyContent: "center", alignItems: "center", boxShadow: mode === choice ? `0 1px 5px ${palette.cardShadow}` : undefined }}><AppText style={{ color: mode === choice ? palette.primary : palette.muted, fontSize: 13, fontWeight: mode === choice ? "800" : "600", textTransform: "capitalize" }}>{choice}</AppText></Pressable>)}
        </View>
        <View style={{ gap: 10 }}>
          <AppText style={{ color: palette.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" }}>Accent scheme</AppText>
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", justifyContent: "space-between", gap: 5 }}>
            {([
              ["pine", "#0D5C4D"], ["ember", "#E67E22"], ["indigo", "#3B5998"], ["berry", "#C0392B"], ["mono", "#2C3E50"],
            ] as const).map(([choice, color]) => <Pressable key={choice} accessibilityRole="radio" accessibilityLabel={`${choice} accent`} accessibilityState={{ checked: accent === choice }} onPress={() => void chooseAccent(choice)} style={{ flex: 1, minHeight: 62, alignItems: "center", justifyContent: "center", gap: 6 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color, borderWidth: accent === choice ? 2 : 0, borderColor: palette.card, outlineWidth: accent === choice ? 2 : 0, outlineColor: color, alignItems: "center", justifyContent: "center" }}>{accent === choice && <CheckIcon size={16} weight="bold" color="#FFFFFF" />}</View>
              <AppText style={{ color: accent === choice ? palette.primary : palette.muted, fontSize: 11, fontWeight: accent === choice ? "800" : "600", textTransform: "capitalize" }}>{choice}</AppText>
            </Pressable>)}
          </View>
        </View>
        <View style={{ gap: 9 }}>
          <AppText style={{ color: palette.muted, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>App font</AppText>
          <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: 10 }}>
            {(["Nunito", "Outfit"] as const).map((choice) => <Pressable key={choice} accessibilityRole="radio" accessibilityLabel={`${choice} font`} accessibilityState={{ checked: font === choice }} onPress={() => chooseFont(choice)} style={({ pressed }) => ({ flex: 1, minHeight: 86, borderRadius: 17, borderCurve: "continuous", borderWidth: font === choice ? 1.5 : 1, borderColor: font === choice ? palette.primary : palette.border, backgroundColor: font === choice ? palette.privacyPanel : palette.homeSurface, padding: 11, justifyContent: "space-between", opacity: pressed ? 0.8 : 1 })}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <AppText style={{ color: palette.text, fontFamily: choice, fontSize: 25, lineHeight: 29, fontWeight: "700" }}>Aa</AppText>
                {font === choice && <CheckIcon size={16} weight="bold" color={palette.primary} />}
              </View>
              <AppText style={{ color: font === choice ? palette.primary : palette.muted, fontSize: 13, fontWeight: "700" }}>{choice}</AppText>
            </Pressable>)}
          </View>
        </View>
        {appearanceError && <AppText accessibilityRole="alert" style={{ color: palette.error, fontSize: 12 }}>{appearanceError}</AppText>}
      </SettingsCard>

      <SettingsCard title="Goals & focus" icon={<TargetIcon size={20} weight="duotone" color={palette.primary} />}>
        <View style={{ backgroundColor: palette.homeSurface, borderRadius: 17, borderCurve: "continuous", padding: 14, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <AppText style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>Coding target</AppText>
            <AppText selectable style={{ color: palette.primary, fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatDuration(selectedHours * 3600)} / day</AppText>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Decrease daily goal by 30 minutes" disabled={selectedHours <= 0.5 || saving} onPress={() => adjustGoal(-0.5)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.card, alignItems: "center", justifyContent: "center", opacity: selectedHours <= 0.5 || saving ? 0.5 : 1 }}><MinusIcon size={17} color={palette.text} /></Pressable>
            <Host style={{ flex: 1, height: 42 }} seedColor={palette.accent} colorScheme={palette.scheme}>
              <Slider value={selectedHours} min={0.5} max={12} step={0.5} onValueChange={setDraftHours} disabled={saving} testID="daily-goal-slider" />
            </Host>
            <Pressable accessibilityRole="button" accessibilityLabel="Increase daily goal by 30 minutes" disabled={selectedHours >= 12 || saving} onPress={() => adjustGoal(0.5)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.card, alignItems: "center", justifyContent: "center", opacity: selectedHours >= 12 || saving ? 0.5 : 1 }}><PlusIcon size={17} color={palette.text} /></Pressable>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <AppText style={{ color: palette.muted, fontSize: 11 }}>30 min to 12 hours</AppText>
            {draftHours !== null && draftHours !== goalSeconds / 3600 && <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveGoal()} style={{ minHeight: 36, paddingHorizontal: 15, borderRadius: 18, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center", opacity: saving ? 0.5 : 1 }}><AppText style={{ color: palette.onPrimary, fontSize: 12, fontWeight: "800" }}>{saving ? "Saving…" : "Save target"}</AppText></Pressable>}
          </View>
        </View>
        {goalError && <AppText accessibilityRole="alert" style={{ color: palette.error, fontSize: 12 }}>{goalError}</AppText>}
      </SettingsCard>

      <SettingsCard title="Offline & local" icon={<CloudArrowDownIcon size={20} weight="duotone" color={palette.primary} />}>
        <View style={{ backgroundColor: palette.homeSurface, borderRadius: 17, borderCurve: "continuous", padding: 14, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <AppText style={{ color: palette.text, fontSize: 13, fontWeight: "700" }}>Local storage</AppText>
            <AppText selectable style={{ color: palette.primary, fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{storageSize}</AppText>
          </View>
          <AppText style={{ color: palette.muted, fontSize: 11 }}>SQLite data on this device</AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: palette.homeSurface, borderRadius: 17, borderCurve: "continuous", padding: 14, gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <AppText selectable style={{ color: palette.text, fontSize: 16, fontWeight: "800" }}>{savedDays === 1 ? "1 recent day saved" : `${savedDays} recent days saved`}</AppText>
            <AppText selectable style={{ color: palette.muted, fontSize: 12 }}>{latestSavedLabel ? `Latest: ${latestSavedLabel}` : "Sync to keep activity on this device"}</AppText>
          </View>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: savedDays ? palette.success : palette.border }} />
        </View>
        {wakatimeConnectionAvailable && <View style={{ flexDirection: "row", alignItems: "center", minHeight: 52, gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <AppText style={{ color: palette.text, fontSize: 14, fontWeight: "700" }}>Sync on app open</AppText>
            <AppText style={{ color: palette.muted, fontSize: 12 }}>Refresh when you launch WakaBoard</AppText>
          </View>
          <Switch accessibilityLabel="Sync on app open" value={autoSync} disabled={preferenceBusy} onValueChange={(enabled) => void changeAutoSync(enabled)} trackColor={{ true: palette.primary }} />
        </View>}
        {accountEmail && <SettingsButton label={syncing ? "Syncing…" : "Sync now"} disabled={syncing || accountBusy} onPress={() => void runManualRefresh(syncWakaTime)} icon={<ArrowsClockwiseIcon size={18} weight="bold" color={palette.onPrimary} />} />}
        {savedDays > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Remove saved activity" disabled={clearingOffline || syncing} onPress={confirmClearOffline} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, opacity: clearingOffline || syncing ? 0.5 : 1 }}><TrashIcon size={16} color={palette.error} /><AppText style={{ color: palette.error, fontSize: 13, fontWeight: "700" }}>{clearingOffline ? "Removing…" : "Remove saved activity"}</AppText></Pressable>}
        {hasSample && <Pressable accessibilityRole="button" onPress={() => void removeSample()} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}><AppText style={{ color: palette.muted, fontSize: 12, fontWeight: "700" }}>Remove sample activity</AppText></Pressable>}
        {(dataError || syncError) && <AppText accessibilityRole="alert" style={{ color: palette.error, fontSize: 12 }}>{dataError ?? syncError}</AppText>}
      </SettingsCard>

      <SettingsCard title="Privacy" icon={<ShieldCheckIcon size={20} color={palette.primary} weight="duotone" />}>
        <View style={{ backgroundColor: palette.homeSurface, borderRadius: 17, padding: 14 }}><AppText style={{ color: palette.muted, fontSize: 12, lineHeight: 19 }}>WakaBoard saves daily totals and activity breakdowns on this device. It does not read your source code.</AppText></View>
      </SettingsCard>

      <View style={{ backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 24, borderCurve: "continuous", padding: 18, gap: 12 }}>
        <AppText style={{ color: palette.primary, fontSize: 17, fontWeight: "800" }}>WakaBoard</AppText>
        <View style={{ backgroundColor: palette.homeSurface, borderRadius: 11, paddingHorizontal: 12, minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><AppText style={{ color: palette.muted, fontSize: 12 }}>Activity source</AppText><AppText style={{ color: palette.primary, fontSize: 12, fontWeight: "700" }}>WakaTime</AppText></View>
        {accountEmail && <Pressable accessibilityRole="button" accessibilityLabel="Sign out of WakaTime" disabled={accountBusy || syncing} onPress={() => void signOut()} style={{ minHeight: 44, borderRadius: 22, backgroundColor: palette.homeSubtle, alignItems: "center", justifyContent: "center", opacity: accountBusy || syncing ? 0.5 : 1 }}><AppText style={{ color: palette.error, fontSize: 13, fontWeight: "800" }}>Sign out</AppText></Pressable>}
      </View>
    </View>
  </Animated.ScrollView>;

  return process.env.EXPO_OS === "android" ? <AndroidPageFrame title="Settings" offset={offset}>{content}</AndroidPageFrame> : content;
}
