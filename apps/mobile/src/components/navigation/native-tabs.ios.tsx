import { NativeTabs } from "expo-router/unstable-native-tabs";
import { HapticPreset } from "../../constants/haptics";
import { usePalette } from "../../theme";

export function NativeTabNavigation() {
  const palette = usePalette();
  return <NativeTabs tintColor={palette.primary} minimizeBehavior="never" screenListeners={{ tabPress: (event) => { if (!event.data.isPrevented) void HapticPreset.selection(); } }}>
    <NativeTabs.Trigger name="(home)">
      <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} />
      <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(insights)">
      <NativeTabs.Trigger.Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
      <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(leaderboard)">
      <NativeTabs.Trigger.Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
      <NativeTabs.Trigger.Label>Leaders</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="(settings)">
      <NativeTabs.Trigger.Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
      <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
