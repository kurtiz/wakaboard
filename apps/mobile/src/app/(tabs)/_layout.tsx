import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { LeaderboardScopeProvider } from "../../components/leaderboard/leaderboard-scope";
import { NativeTabNavigation } from "../../components/navigation/native-tabs";
import { authClient } from "../../data/wakatime-client";
import { usePalette } from "../../theme";

export default function TabLayout() {
  const palette = usePalette();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void authClient.getCookie()
      .then((cookie) => { if (active) setSignedIn(Boolean(cookie)); })
      .catch(() => { if (active) setSignedIn(false); });
    return () => { active = false; };
  }, []);

  if (signedIn === null) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: palette.background }}><ActivityIndicator color={palette.primary} /></View>;
  if (!signedIn) return <Redirect href="/auth" />;

  return <LeaderboardScopeProvider><NativeTabNavigation /></LeaderboardScopeProvider>;
}
