import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useDashboard } from "../data/dashboard-context";
import { authClient } from "../data/wakatime-client";
import { usePalette } from "../theme";

export default function Index() {
  const { loading, onboardingComplete } = useDashboard();
  const palette = usePalette();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void authClient.getCookie()
      .then((cookie) => { if (active) setSignedIn(Boolean(cookie)); })
      .catch(() => { if (active) setSignedIn(false); });
    return () => { active = false; };
  }, []);

  if (loading || signedIn === null) {
    return <View style={{ flex: 1, justifyContent: "center", backgroundColor: palette.background }}><ActivityIndicator color={palette.primary} /></View>;
  }
  return <Redirect href={signedIn ? "/(tabs)/(home)" : onboardingComplete ? "/auth" : "/onboarding"} />;
}
