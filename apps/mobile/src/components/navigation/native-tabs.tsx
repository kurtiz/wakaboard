import { NativeTabs } from "expo-router/unstable-native-tabs";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

export function NativeTabNavigation() {
  const palette = usePalette();
  return <NativeTabs tintColor={palette.accent} backgroundColor={palette.card} screenListeners={{ tabPress: (event) => { if (!event.data.isPrevented) void HapticPreset.selection(); } }}>
    <NativeTabs.Trigger name="(home)"><NativeTabs.Trigger.Icon sf="house.fill" md="home" /><NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="(insights)"><NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" /><NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="(leaderboard)"><NativeTabs.Trigger.Icon sf="trophy.fill" md="leaderboard" /><NativeTabs.Trigger.Label>Leaders</NativeTabs.Trigger.Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="(settings)"><NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" /><NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label></NativeTabs.Trigger>
  </NativeTabs>;
}
