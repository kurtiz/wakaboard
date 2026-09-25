import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
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

  return (
    <NativeTabs tintColor={palette.accent} backgroundColor={palette.card}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(insights)">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(leaderboard)">
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="leaderboard" />
        <NativeTabs.Trigger.Label>Leaders</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
