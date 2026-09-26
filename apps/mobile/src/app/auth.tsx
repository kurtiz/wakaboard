import { Text } from "../components/ui/app-text";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthDoodleBackground } from "../components/auth/auth-doodle-background";
import { WakaTimeMark } from "../components/auth/wakatime-mark";
import { ActionButton } from "../components/ui/action-button";
import { BrandMark } from "../components/ui/brand-mark";
import { HapticPreset } from "../constants/haptics";
import { useDashboard } from "../data/dashboard-context";
import { useLeaderboards } from "../data/leaderboard-context";
import { apiKeyStorageAvailable, authClient, saveWakaTimeApiKey, validateWakaTimeApiKey, wakatimeConnectionAvailable } from "../data/wakatime-client";
import { usePalette } from "../theme";

export default function AuthScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { syncWakaTime } = useDashboard();
  const { refresh: refreshLeaderboards } = useLeaderboards();
  const [useApiKey, setUseApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function continueToApp() {
    void HapticPreset.confirm();
    router.replace("/(tabs)/(home)");
    void Promise.allSettled([syncWakaTime(), refreshLeaderboards()]);
  }

  async function connectWithWakaTime() {
    setBusy(true);
    setError(null);
    try {
      const { error: authError } = await authClient.signIn.social({ provider: "wakatime", callbackURL: "/" });
      if (authError) throw new Error(authError.message);
      const { data: session } = await authClient.getSession();
      if (!session?.user) throw new Error("WakaTime sign-in did not finish. Please try again.");
      continueToApp();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Try again.");
      void HapticPreset.error();
    } finally {
      setBusy(false);
    }
  }

  async function connectWithApiKey() {
    setBusy(true);
    setError(null);
    try {
      await validateWakaTimeApiKey(apiKey);
      await saveWakaTimeApiKey(apiKey);
      setApiKey("");
      continueToApp();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not connect. Try again.");
      void HapticPreset.error();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "transparent" }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }}
      >
        <AuthDoodleBackground />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <BrandMark size={34} />
          <Text style={{ color: palette.text, fontSize: 20, fontWeight: "800" }}>WakaBoard</Text>
        </View>

        <View style={{ flex: 1, justifyContent: "center", paddingVertical: useApiKey ? 28 : 56 }}>
          <View style={{ backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 26, borderCurve: "continuous", padding: 24, gap: 12 }}>
            <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1.1 }}>Your coding, in focus.</Text>
            <Text style={{ color: palette.muted, fontSize: 16, lineHeight: 24 }}>
              See your coding time, projects, goals, and progress in one place.
            </Text>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          {useApiKey ? (
            <View style={{ backgroundColor: palette.card, borderColor: palette.border, borderWidth: 1, borderRadius: 24, borderCurve: "continuous", padding: 20, gap: 12 }}>
              <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700" }}>Use your API key</Text>
              <Text style={{ color: palette.muted, fontSize: 14, lineHeight: 20 }}>Paste your WakaTime API key. It will be saved securely on this device.</Text>
              <TextInput
                accessibilityLabel="WakaTime API key"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                secureTextEntry
                value={apiKey}
                onChangeText={setApiKey}
                onSubmitEditing={() => { if (apiKey.trim() && !busy) void connectWithApiKey(); }}
                placeholder="WakaTime API key"
                placeholderTextColor={palette.muted}
                selectionColor={palette.primary}
                style={{ minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.background, color: palette.text, fontSize: 16, paddingHorizontal: 16 }}
              />
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://wakatime.com/api-key")} style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center" }}>
                <Text style={{ color: palette.primary, fontSize: 14, fontWeight: "700" }}>Where do I find my key?</Text>
              </Pressable>
            </View>
          ) : null}

          {error ? <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 14, lineHeight: 20 }}>{error}</Text> : null}
          {wakatimeConnectionAvailable ? (
            <ActionButton
              label={busy ? "Connecting…" : useApiKey ? "Connect with API key" : "Continue with WakaTime"}
              leading={!useApiKey ? <WakaTimeMark color={palette.onPrimary} /> : undefined}
              disabled={busy || (useApiKey && !apiKey.trim())}
              onPress={() => void (useApiKey ? connectWithApiKey() : connectWithWakaTime())}
            />
          ) : <Text style={{ color: palette.error, fontSize: 14 }}>WakaTime connection is not configured on this build.</Text>}
          {wakatimeConnectionAvailable && apiKeyStorageAvailable ? (
            <ActionButton
              label={useApiKey ? "Use WakaTime sign-in instead" : "Use an API key instead"}
              secondary
              disabled={busy}
              onPress={() => { setError(null); setApiKey(""); setUseApiKey((current) => !current); }}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
