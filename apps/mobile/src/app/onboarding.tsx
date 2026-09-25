import { router } from "expo-router";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { useEffect, useState } from "react";
import { BackHandler, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, OnboardingArt } from "../components/onboarding-art";
import { OnboardingButton } from "../components/onboarding-button";
import { useDashboard } from "../data/dashboard-context";
import { usePalette } from "../theme";

const slides = [
  {
    eyebrow: "GLANCEABLE TELEMETRY",
    title: "Know your coding day in 10 calm seconds.",
    body: "WakaBoard turns your WakaTime activity into a clear daily summary of your time, projects, and progress.",
    secondary: "Skip introduction",
    footer: "OAuth 2.0 secure · Read-only telemetry · Free plan",
  },
  {
    eyebrow: "OFFLINE-FIRST & PRIVATE",
    title: "Works anywhere. Private by design.",
    body: "WakaTime powers your metrics. WakaBoard saves recent summaries on this device for instant access, even in flight mode. It never needs your source code.",
    secondary: "Skip introduction",
    footer: "Secure OAuth · Read-only telemetry · Revoke anytime",
  },
  {
    eyebrow: "FRICTIONLESS SETUP",
    title: "Connect & start your flow.",
    body: "Authenticate securely with WakaTime, then explore your own coding activity, goals, and standing.",
    secondary: "Back to privacy",
    footer: "Official WakaTime API · No source code access",
  },
] as const;

export default function OnboardingScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { completeOnboarding } = useDashboard();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slide = slides[step];

  useEffect(() => {
    if (step === 0) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setError(null);
      setStep((current) => Math.max(0, current - 1));
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await completeOnboarding();
      router.replace("/auth");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not finish the introduction. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 22, paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <BrandMark />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {step > 0 && <OnboardingButton label="Back" compact secondary disabled={busy} onPress={() => { setError(null); setStep(step - 1); }} />}
          {step < 2 ? (
            <OnboardingButton label="Skip" compact secondary disabled={busy} onPress={() => void finish()} />
          ) : (
            <View style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border }}>
              <Text style={{ color: palette.muted, fontSize: 11 }}>Step 3 of 3</Text>
            </View>
          )}
        </View>
      </View>

      <Animated.View key={`art-${step}`} entering={reduceMotion ? undefined : FadeIn.duration(220)} style={{ flex: 1, minHeight: step === 0 ? 335 : 300, justifyContent: "center" }}>
        <OnboardingArt step={step} />
      </Animated.View>

      <Animated.View key={`copy-${step}`} entering={reduceMotion ? undefined : FadeIn.duration(220)} style={{ alignItems: "center", gap: 10, paddingHorizontal: 10 }}>
        <View style={{ borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: palette.primary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>{slide.eyebrow}</Text>
        </View>
        <Text accessibilityRole="header" style={{ color: palette.text, textAlign: "center", fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.7 }}>{slide.title}</Text>
        <Text style={{ color: palette.muted, textAlign: "center", fontSize: 14, lineHeight: 21, maxWidth: 325 }}>{slide.body}</Text>
      </Animated.View>

      <View style={{ gap: 7, alignItems: "center" }}>
        <View accessibilityLabel={`Onboarding step ${step + 1} of 3`} style={{ flexDirection: "row", gap: 6, paddingVertical: 7 }}>
          {slides.map((item, index) => (
            <View
              key={item.eyebrow}
              style={{ width: index === step ? 22 : 7, height: 7, borderRadius: 999, backgroundColor: index === step ? palette.primary : palette.border }}
            />
          ))}
        </View>
        {error && <Text accessibilityRole="alert" style={{ color: palette.error, fontSize: 13, textAlign: "center", lineHeight: 18 }}>{error}</Text>}
        <OnboardingButton
          label={step < 2 ? "Continue" : busy ? "Continuing…" : "Continue to sign in"}
          disabled={busy}
          onPress={() => step < 2 ? (setError(null), setStep(step + 1)) : void finish()}
          trailing={<CaretRightIcon color={palette.onPrimary} size={19} weight="bold" />}
        />
        <OnboardingButton
          label={slide.secondary}
          secondary
          disabled={busy}
          onPress={() => step === 2 ? (setError(null), setStep(1)) : void finish()}
        />
        <Text style={{ color: palette.muted, fontSize: 10, textAlign: "center", lineHeight: 15 }}>{slide.footer}</Text>
      </View>
    </ScrollView>
  );
}
