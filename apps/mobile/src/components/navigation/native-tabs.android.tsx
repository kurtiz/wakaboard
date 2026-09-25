import { NativeTabs } from "expo-router/unstable-native-tabs";
import { usePalette } from "../../theme";

export function NativeTabNavigation() {
  const palette = usePalette();
  return <NativeTabs tintColor={palette.accent} backgroundColor={palette.card}>
    <NativeTabs.Trigger name="(home)">
      <NativeTabs.Trigger.Icon md="home" />
      <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(insights)">
      <NativeTabs.Trigger.Icon md="bar_chart" />
      <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(leaderboard)">
      <NativeTabs.Trigger.Icon md="leaderboard" />
      <NativeTabs.Trigger.Label>Leaders</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(settings)">
      <NativeTabs.Trigger.Icon md="settings" />
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
