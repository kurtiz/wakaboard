import { Text } from "../components/ui/app-text";
import { router } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, OnboardingArt } from "../components/onboarding/onboarding-art";
import { OnboardingButton } from "../components/onboarding/onboarding-button";
import { LoadingIndicator } from "../components/ui/loading-indicator";
import { HapticPreset } from "../constants/haptics";
import { useDashboard } from "../data/dashboard-context";
import { useLeaderboards } from "../data/leaderboard-context";
import { authClient, wakatimeConnectionAvailable } from "../data/wakatime-client";
import { usePalette } from "../theme";

export default function AuthScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { syncWakaTime } = useDashboard();
  const { refresh: refreshLeaderboards } = useLeaderboards();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const { error: authError } = await authClient.signIn.social({ provider: "wakatime", callbackURL: "/" });
      if (authError) throw new Error(authError.message);
      const { data: session } = await authClient.getSession();
      if (!session?.user) throw new Error("WakaTime sign-in did not finish. Please try again.");
      void HapticPreset.confirm();
      router.replace("/(tabs)/(home)");
      void Promise.allSettled([syncWakaTime(), refreshLeaderboards()]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Try again.");
      void HapticPreset.error();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 24, paddingHorizontal: 20, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }}
    >
      <BrandMark />
      <View style={{ flex: 1, justifyContent: "center" }}><OnboardingArt step={2} /></View>
      <View style={{ alignItems: "center", gap: 12 }}>
        <Text style={{ color: palette.primary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }}>WELCOME TO WAKABOARD</Text>
        <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 30, lineHeight: 36, fontWeight: "800", textAlign: "center" }}>Connect your coding day.</Text>
        <Text style={{ color: palette.muted, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 330 }}>Sign in securely with WakaTime to see your activity, goals, and leaderboard standing.</Text>
      </View>
      <View style={{ gap: 12, alignItems: "center" }}>
        {error && <Text accessibilityRole="alert" style={{ color: palette.error, textAlign: "center" }}>{error}</Text>}
        {wakatimeConnectionAvailable ? (
          <OnboardingButton label={busy ? "Connecting…" : "Connect WakaTime"} disabled={busy} onPress={() => void connect()} trailing={busy ? <LoadingIndicator color={palette.onPrimary} size="small" /> : <CaretRightIcon color={palette.onPrimary} size={19} weight="bold" />} />
        ) : (
          <Text style={{ color: palette.muted, textAlign: "center" }}>WakaTime connection is not configured on this build.</Text>
        )}
        <Text style={{ color: palette.muted, fontSize: 11, textAlign: "center" }}>Official WakaTime API · Read-only activity · No source code access</Text>
      </View>
    </ScrollView>
  );
}
