import { Button, FieldGroup, Host, Slider, Text } from "@expo/ui";
import { background, scrollContentBackground } from "@expo/ui/swift-ui/modifiers";
import { formatDuration } from "@wakaboard/core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import { AndroidLargeTitle, AndroidPageFrame, useAndroidPageScroll } from "../../../components/navigation/android-page-header";
import { Text as AppText } from "../../../components/ui/app-text";
import { useDashboard } from "../../../data/dashboard-context";
import { useLeaderboards } from "../../../data/leaderboard-context";
import { authClient, wakatimeConnectionAvailable } from "../../../data/wakatime-client";
import { useFontChoice } from "../../../font-choice";
import { usePalette } from "../../../theme";

export default function SettingsScreen() {
  const palette = usePalette();
  const { offset, onScroll } = useAndroidPageScroll();
  const { font, setFont } = useFontChoice();
  const { goalSeconds, summaries, setGoalHours, clearSample, clearWakaTime, syncWakaTime, syncing, syncError } = useDashboard();
  const { refresh: refreshLeaderboards, clear: clearLeaderboards } = useLeaderboards();
  const [draftHours, setDraftHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const selectedHours = draftHours ?? goalSeconds / 3600;
  const hasSample = summaries.some((day) => day.source === "sample");

  useEffect(() => {
    if (wakatimeConnectionAvailable) {
      void authClient.getSession()
        .then(({ data }) => setAccountEmail(data?.user.email ?? null))
        .catch(() => setAccountEmail(null));
    }
  }, []);

  async function connect() {
    setAccountBusy(true);
    setAccountError(null);
    try {
      const { error } = await authClient.signIn.social({ provider: "wakatime", callbackURL: "/" });
      if (error) throw new Error(error.message);
      const { data } = await authClient.getSession();
      setAccountEmail(data?.user.email ?? null);
      if (data?.user) await Promise.all([syncWakaTime(), refreshLeaderboards()]);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "WakaTime sign-in failed.");
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
      router.replace("/auth");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setAccountBusy(false);
    }
  }

  async function saveGoal() {
    setSaving(true);
    try {
      await setGoalHours(selectedHours);
      setDraftHours(null);
    } finally {
      setSaving(false);
    }
  }

  if (process.env.EXPO_OS === "android") return <AndroidPageFrame title="Settings" offset={offset}>
    <Animated.ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16} style={{ flex: 1, backgroundColor: palette.background }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40, gap: 16 }}>
      <AndroidLargeTitle title="Settings" offset={offset} />
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: palette.card, gap: 12 }}>
        <AppText style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>App font</AppText>
        <AppText style={{ color: palette.muted, fontSize: 13 }}>See how each font looks across the app.</AppText>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {(["Nunito", "Outfit"] as const).map((choice) => <Pressable key={choice} accessibilityRole="button" accessibilityState={{ selected: font === choice }} onPress={() => setFont(choice)} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: "center", backgroundColor: font === choice ? palette.primary : palette.homeSubtle }}><AppText style={{ color: font === choice ? palette.onPrimary : palette.text, fontSize: 14, fontWeight: "800" }}>{choice}</AppText></Pressable>)}
        </View>
      </View>
      {wakatimeConnectionAvailable ? <View style={{ padding: 18, borderRadius: 22, backgroundColor: palette.card, gap: 12 }}>
        <AppText style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>WakaTime</AppText>
        <AppText style={{ color: palette.muted, fontSize: 13 }}>{accountEmail ? `Connected as ${accountEmail}` : "Connect to see your real coding activity."}</AppText>
        {accountEmail ? <>
          <Pressable accessibilityRole="button" disabled={syncing || accountBusy} onPress={() => void syncWakaTime()} style={{ padding: 13, borderRadius: 14, alignItems: "center", backgroundColor: palette.primary, opacity: syncing || accountBusy ? 0.5 : 1 }}><AppText style={{ color: palette.onPrimary, fontWeight: "800" }}>{syncing ? "Syncing…" : "Sync activity"}</AppText></Pressable>
          <Pressable accessibilityRole="button" disabled={accountBusy || syncing} onPress={() => void signOut()} style={{ padding: 13, alignItems: "center" }}><AppText style={{ color: palette.error, fontWeight: "800" }}>Sign out</AppText></Pressable>
        </> : <Pressable accessibilityRole="button" disabled={accountBusy} onPress={() => void connect()} style={{ padding: 13, borderRadius: 14, alignItems: "center", backgroundColor: palette.primary, opacity: accountBusy ? 0.5 : 1 }}><AppText style={{ color: palette.onPrimary, fontWeight: "800" }}>{accountBusy ? "Connecting…" : "Connect WakaTime"}</AppText></Pressable>}
        {accountError || syncError ? <AppText accessibilityRole="alert" style={{ color: palette.error, fontSize: 13 }}>{accountError ?? syncError}</AppText> : null}
      </View> : null}
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: palette.card, gap: 12 }}>
        <AppText style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>Daily coding goal</AppText>
        <AppText selectable style={{ color: palette.text, fontSize: 28, fontWeight: "800" }}>{formatDuration(selectedHours * 3600)}</AppText>
        <Host style={{ width: "100%", height: 48 }} seedColor={palette.accent} colorScheme={palette.scheme}>
          <Slider value={selectedHours} min={0.5} max={12} step={0.5} onValueChange={setDraftHours} disabled={saving} testID="daily-goal-slider" />
        </Host>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveGoal()} style={{ padding: 13, borderRadius: 14, alignItems: "center", backgroundColor: palette.primary, opacity: saving ? 0.5 : 1 }}><AppText style={{ color: palette.onPrimary, fontWeight: "800" }}>{saving ? "Saving…" : "Save goal"}</AppText></Pressable>
        <AppText style={{ color: palette.muted, fontSize: 12 }}>Choose between 30 minutes and 12 hours. Your goal is saved on this device.</AppText>
      </View>
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: palette.card, gap: 12 }}>
        <AppText style={{ color: palette.text, fontSize: 17, fontWeight: "800" }}>Your data</AppText>
        <AppText style={{ color: palette.muted, fontSize: 13 }}>Activity is saved on this device for quick, offline viewing.</AppText>
        {hasSample ? <Pressable accessibilityRole="button" onPress={() => void clearSample()} style={{ padding: 13, borderRadius: 14, alignItems: "center", backgroundColor: palette.homeSubtle }}><AppText style={{ color: palette.text, fontWeight: "800" }}>Remove sample activity</AppText></Pressable> : null}
      </View>
    </Animated.ScrollView>
  </AndroidPageFrame>;

  return (
    <Host style={{ flex: 1, backgroundColor: palette.background }} seedColor={palette.accent} colorScheme={palette.scheme}>
      <FieldGroup modifiers={[scrollContentBackground("hidden"), background(palette.background)]}>
        <FieldGroup.Section title="App font">
          <Text textStyle={{ fontSize: 15, color: palette.text, fontFamily: font }}>
            See how each font looks across the app.
          </Text>
          <Button label={font === "Nunito" ? "✓ Nunito" : "Nunito"} onPress={() => setFont("Nunito")} />
          <Button label={font === "Outfit" ? "✓ Outfit" : "Outfit"} onPress={() => setFont("Outfit")} />
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: palette.muted }}>
              Switch fonts, then browse Home, Insights, and Leaderboard to compare.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        {wakatimeConnectionAvailable && (
          <FieldGroup.Section title="WakaTime">
            <Text textStyle={{ fontSize: 15, color: palette.text }}>
              {accountEmail ? `Connected as ${accountEmail}` : "Connect to see your real coding activity."}
            </Text>
            {accountEmail ? (
              <>
                <Button label={syncing ? "Syncing…" : "Sync activity"} disabled={syncing || accountBusy} onPress={() => void syncWakaTime()} />
                <Button label="Sign out" variant="text" disabled={accountBusy || syncing} onPress={() => void signOut()} />
              </>
            ) : (
              <Button label={accountBusy ? "Connecting…" : "Connect WakaTime"} disabled={accountBusy} onPress={() => void connect()} />
            )}
            {(accountError || syncError) && (
              <Text textStyle={{ fontSize: 13, color: palette.error }}>
                {accountError ?? syncError ?? ""}
              </Text>
            )}
          </FieldGroup.Section>
        )}
        <FieldGroup.Section title="Daily coding goal">
          <Text textStyle={{ fontSize: 28, fontWeight: "bold", color: palette.text }}>
            {formatDuration(selectedHours * 3600)}
          </Text>
          <Slider
            value={selectedHours}
            min={0.5}
            max={12}
            step={0.5}
            onValueChange={setDraftHours}
            disabled={saving}
            testID="daily-goal-slider"
          />
          <Button
            label={saving ? "Saving…" : "Save goal"}
            disabled={saving}
            onPress={() => void saveGoal()}
          />
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: palette.muted }}>
              Choose between 30 minutes and 12 hours. Your goal is saved on this device.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Your data">
          <Text textStyle={{ fontSize: 15, color: palette.text }}>
            Activity is saved on this device for quick, offline viewing.
          </Text>
          {hasSample && (
            <Button
              label="Remove sample activity"
              variant="outlined"
              onPress={() => void clearSample()}
            />
          )}
          <FieldGroup.SectionFooter>
            <Text textStyle={{ fontSize: 13, color: palette.muted }}>
              Sample activity is clearly marked and can be removed at any time.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
